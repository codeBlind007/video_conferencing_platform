"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { rtcConfiguration } from "@/lib/webrtc";
import {
  MeetingDetailResponse,
  Participant,
  SignalingMessage,
  RoomParticipantInfo
} from "@/types";
import { VideoGrid, RemoteParticipantStream } from "@/components/VideoGrid";
import { ControlBar } from "@/components/ControlBar";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { ChatPanel } from "@/components/ChatPanel";

function getWebSocketUrl(meetingId: string, token: string): string {
  let baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

  // Automatically upgrade ws:// to wss:// if page is loaded over HTTPS
  if (typeof window !== "undefined") {
    if (window.location.protocol === "https:") {
      baseUrl = baseUrl.replace(/^ws:\/\//i, "wss://");
      if (!baseUrl.startsWith("wss://") && !baseUrl.startsWith("ws://")) {
        baseUrl = `wss://${baseUrl}`;
      }
    } else if (!baseUrl.startsWith("wss://") && !baseUrl.startsWith("ws://")) {
      baseUrl = `ws://${baseUrl}`;
    }
  }

  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, "");

  return `${baseUrl}/api/ws/meetings/${meetingId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

interface PeerState {
  userId: number;
  displayName: string;
  pc: RTCPeerConnection;
  stream: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const meetingId = params.meetingId as string;
  const router = useRouter();
  const { user } = useAuth();

  // Meeting State
  const [meeting, setMeeting] = useState<MeetingDetailResponse | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [displayName, setDisplayName] = useState<string>("Guest");

  // Local Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isLocalVideoOff, setIsLocalVideoOff] = useState(false);

  // Peer Connections State (userId -> PeerState)
  const peerConnectionsRef = useRef<Map<number, PeerState>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<RemoteParticipantStream[]>([]);

  // Panels & UI State
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; timestamp: string }>>([]);

  // Refs for WebSocket & cleanup
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Helper to trigger remote streams re-render
  const updateRemoteStreamsList = useCallback(() => {
    const list: RemoteParticipantStream[] = [];
    peerConnectionsRef.current.forEach((peer) => {
      list.push({
        userId: peer.userId,
        displayName: peer.displayName,
        stream: peer.stream,
        isMuted: peer.isMuted,
        isVideoOff: peer.isVideoOff,
      });
    });
    setRemoteStreams(list);
  }, []);

  // Fetch Participants List from Backend
  const fetchParticipantsList = useCallback(async () => {
    try {
      const list = await apiRequest<Participant[]>(`/api/meetings/${meetingId}/participants`);
      setParticipants(list);
    } catch (e) {
      console.warn("Failed to fetch participant list", e);
    }
  }, [meetingId]);

  // 1. Initial Setup: Validate Meeting, Join Backend, & Media Stream
  useEffect(() => {
    let mounted = true;

    async function initRoom() {
      try {
        // Fetch meeting details
        const detail = await apiRequest<MeetingDetailResponse>(`/api/meetings/${meetingId}`);
        if (!mounted) return;
        if (!detail.is_active) {
          alert("This meeting has ended.");
          router.replace("/dashboard");
          return;
        }
        setMeeting(detail);

        // Get saved display name or current user name
        const savedName = sessionStorage.getItem(`display_name_${meetingId}`);
        const finalName = savedName || user?.name || "Participant";
        setDisplayName(finalName);

        // Call Join API endpoint
        await apiRequest(`/api/meetings/${meetingId}/join`, {
          method: "POST",
          data: { display_name: finalName },
        });

        // Initialize Local Media Stream
        const initialMicPref = sessionStorage.getItem(`initial_mic_${meetingId}`) !== "off";
        const initialCamPref = sessionStorage.getItem(`initial_cam_${meetingId}`) !== "off";

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Apply initial media preferences
        stream.getAudioTracks().forEach((t) => (t.enabled = initialMicPref));
        stream.getVideoTracks().forEach((t) => (t.enabled = initialCamPref));

        setIsLocalMuted(!initialMicPref);
        setIsLocalVideoOff(!initialCamPref);

        setLocalStream(stream);
        localStreamRef.current = stream;

        // Fetch initial participants
        fetchParticipantsList();
      } catch (err: any) {
        console.error("Room initialization error", err);
        alert(err.message || "Failed to enter meeting room.");
        router.replace("/dashboard");
      }
    }

    initRoom();

    return () => {
      mounted = false;
      // Stop local media tracks on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [meetingId, user, router, fetchParticipantsList]);

  // 2. WebSocket Signaling & WebRTC Peer Connections Management
  useEffect(() => {
    if (!localStream || !user) return;

    let ws: WebSocket | null = null;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("zoom_clone_token") || "" : "";
      const wsUrl = getWebSocketUrl(meetingId, token);
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to WebRTC Signaling Server");
      };

      ws.onerror = (err) => {
        console.warn("WebSocket Signaling Connection Error:", err);
      };
    } catch (wsErr) {
      console.error("Failed to construct WebSocket:", wsErr);
      return;
    }

    // Create RTCPeerConnection for a remote peer
    const createPeer = (targetUserId: number, peerDisplayName: string, isInitiator: boolean) => {
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      console.log(`Creating RTCPeerConnection for target user ${targetUserId} (${peerDisplayName}), initiator: ${isInitiator}`);
      const pc = new RTCPeerConnection(rtcConfiguration);
      const remoteStream = new MediaStream();

      // Add local stream tracks to PeerConnection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "ice-candidate",
              target_user_id: targetUserId,
              data: event.candidate,
            })
          );
        }
      };

      // Handle Remote Stream Tracks
      pc.ontrack = (event) => {
        console.log(`Received remote track from user ${targetUserId}:`, event.track.kind);
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
            remoteStream.addTrack(track);
          }
        });
        updateRemoteStreamsList();
      };

      const peerState: PeerState = {
        userId: targetUserId,
        displayName: peerDisplayName,
        pc,
        stream: remoteStream,
        isMuted: false,
        isVideoOff: false,
      };

      peerConnectionsRef.current.set(targetUserId, peerState);
      updateRemoteStreamsList();

      // If initiator, generate SDP Offer
      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "offer",
                  target_user_id: targetUserId,
                  data: pc.localDescription,
                })
              );
            }
          })
          .catch((err) => console.error("Error creating SDP Offer:", err));
      }

      return peerState;
    };

    // Close PeerConnection helper
    const removePeer = (targetUserId: number) => {
      const peer = peerConnectionsRef.current.get(targetUserId);
      if (peer) {
        peer.pc.close();
        peerConnectionsRef.current.delete(targetUserId);
        updateRemoteStreamsList();
      }
    };

    // Process Received WebSocket Signaling Messages
    ws.onmessage = async (event) => {
      try {
        const msg: SignalingMessage = JSON.parse(event.data);
        console.log("Signaling Message Received:", msg.type, msg);

        switch (msg.type) {
          case "room-state":
            // Received active room participants on join
            if (msg.active_participants) {
              msg.active_participants.forEach((p: RoomParticipantInfo) => {
                if (p.user_id !== user.id) {
                  createPeer(p.user_id, p.display_name, true);
                }
              });
            }
            fetchParticipantsList();
            break;

          case "participant-joined":
            if (msg.user_id && msg.user_id !== user.id) {
              createPeer(msg.user_id, msg.display_name || "Participant", false);
              fetchParticipantsList();
            }
            break;

          case "offer":
            if (msg.sender_user_id && msg.data) {
              const peer = createPeer(msg.sender_user_id, msg.display_name || "Participant", false);
              await peer.pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              const answer = await peer.pc.createAnswer();
              await peer.pc.setLocalDescription(answer);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "answer",
                    target_user_id: msg.sender_user_id,
                    data: answer,
                  })
                );
              }
            }
            break;

          case "answer":
            if (msg.sender_user_id && msg.data) {
              const peer = peerConnectionsRef.current.get(msg.sender_user_id);
              if (peer) {
                await peer.pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              }
            }
            break;

          case "ice-candidate":
            if (msg.sender_user_id && msg.data) {
              const peer = peerConnectionsRef.current.get(msg.sender_user_id);
              if (peer) {
                await peer.pc.addIceCandidate(new RTCIceCandidate(msg.data));
              }
            }
            break;

          case "participant-left":
            if (msg.user_id) {
              removePeer(msg.user_id);
              fetchParticipantsList();
            }
            break;

          case "participant-muted":
            if (msg.user_id) {
              const peer = peerConnectionsRef.current.get(msg.user_id);
              if (peer) {
                peer.isMuted = msg.is_muted;
                updateRemoteStreamsList();
              }
              fetchParticipantsList();
            }
            break;

          case "mute-all":
            // Host muted everyone: mute local audio track
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
              setIsLocalMuted(true);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "participant-muted", is_muted: true }));
              }
            }
            fetchParticipantsList();
            break;

          case "mute-participant":
            if (msg.target_user_id === user.id) {
              const shouldMute = msg.is_muted !== false;
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !shouldMute));
                setIsLocalMuted(shouldMute);
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "participant-muted", is_muted: shouldMute }));
                }
              }
            }
            if (msg.target_user_id) {
              const peer = peerConnectionsRef.current.get(msg.target_user_id);
              if (peer) {
                peer.isMuted = msg.is_muted !== false;
                updateRemoteStreamsList();
              }
            }
            fetchParticipantsList();
            break;

          case "participant-removed":
            if (msg.user_id === user.id) {
              alert("You have been removed from the meeting by the host.");
              router.replace("/dashboard");
            } else if (msg.user_id) {
              removePeer(msg.user_id);
              fetchParticipantsList();
            }
            break;

          case "meeting-ended":
            alert("The host has ended the meeting.");
            router.replace("/dashboard");
            break;

          case "chat":
            if (msg.text) {
              const incomingMsg = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                sender: msg.sender || "Participant",
                text: msg.text,
                timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              };
              setChatMessages((prev) => [...prev, incomingMsg]);
            }
            break;

          default:
            break;
        }
      } catch (e) {
        console.error("Error processing WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Signaling Connection Closed");
    };

    return () => {
      // Clean up all peer connections & websocket on unmount
      peerConnectionsRef.current.forEach((peer) => peer.pc.close());
      peerConnectionsRef.current.clear();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [localStream, user, meetingId, router, fetchParticipantsList, updateRemoteStreamsList]);

  // 3. User Controls (Mute Mic / Toggle Camera / Leave / Host Actions)
  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMutedState = !audioTrack.enabled;
        setIsLocalMuted(newMutedState);

        // Notify WebSocket server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "participant-muted",
              is_muted: newMutedState,
            })
          );
        }
      }
    }
  };

  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsLocalVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      await apiRequest(`/api/meetings/${meetingId}/leave`, { method: "POST" });
    } catch (e) {
      console.warn("Leave meeting request error", e);
    } finally {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
      }
      router.replace("/dashboard");
    }
  };

  // 4. Host Actions
  const isHost = meeting ? user?.id === meeting.host_id : false;

  const handleHostEndMeeting = async () => {
    if (!confirm("Are you sure you want to end this meeting for everyone?")) return;
    try {
      await apiRequest(`/api/meetings/${meetingId}/end`, { method: "PATCH" });
      router.replace("/dashboard");
    } catch (e: any) {
      alert(e.message || "Failed to end meeting.");
    }
  };

  const handleHostMuteAll = async () => {
    try {
      await apiRequest(`/api/meetings/${meetingId}/mute-all`, { method: "POST" });
    } catch (e: any) {
      alert(e.message || "Failed to mute all participants.");
    }
  };

  const handleHostMuteSingleParticipant = async (
    participantId: number,
    targetUserId: number,
    targetMuteState: boolean
  ) => {
    try {
      await apiRequest(
        `/api/meetings/${meetingId}/participants/${participantId}/mute?is_muted=${targetMuteState}`,
        { method: "POST" }
      );
      fetchParticipantsList();
    } catch (e: any) {
      alert(e.message || "Failed to update participant mute state.");
    }
  };

  const handleHostRemoveParticipant = async (participantId: number) => {
    if (!confirm("Remove this participant from the meeting?")) return;
    try {
      await apiRequest(`/api/meetings/${meetingId}/participants/${participantId}`, {
        method: "DELETE",
      });
      fetchParticipantsList();
    } catch (e: any) {
      alert(e.message || "Failed to remove participant.");
    }
  };

  const handleSendMessage = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      sender: displayName,
      text,
      timestamp,
    };
    setChatMessages((prev) => [...prev, newMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          text,
          sender: displayName,
          timestamp,
        })
      );
    }
  };

  if (!meeting || !localStream) {
    return (
      <div className="h-screen h-[100dvh] w-screen bg-[#0F172A] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0E71EB]"></div>
        <p className="text-sm text-slate-400 font-medium">Entering meeting room...</p>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] w-screen bg-[#0F172A] text-white flex flex-col overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-12 shrink-0 bg-[#1E293B] px-3 sm:px-4 border-b border-slate-700/60 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md">{meeting.title}</span>
          <span className="bg-slate-800 text-[10px] sm:text-xs font-mono px-2 py-0.5 sm:px-2.5 rounded-full text-slate-300 border border-slate-700 shrink-0">
            <span className="hidden sm:inline">ID: </span>{meetingId}
          </span>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-300 shrink-0">
          Participants: <strong className="text-white">{1 + remoteStreams.length}</strong>
        </div>
      </header>

      {/* Main Content Area (Video Area + Side Panels) */}
      <main className="flex-1 min-h-0 min-w-0 flex flex-row overflow-hidden relative">
        {/* Video Grid Area */}
        <div className="flex-1 min-h-0 min-w-0 bg-[#0B0F17] flex items-center justify-center overflow-hidden relative">
          <VideoGrid
            localStream={localStream}
            localDisplayName={displayName}
            isLocalMuted={isLocalMuted}
            isLocalVideoOff={isLocalVideoOff}
            remoteStreams={remoteStreams}
            hostUserId={meeting.host_id}
            currentUserId={user?.id}
          />
        </div>

        {/* Side Panel: Chat or Participants */}
        {(isParticipantsOpen || isChatOpen) && (
          <div className="w-full sm:w-80 md:w-96 shrink-0 h-full min-h-0 border-l border-slate-700 bg-white text-slate-900 flex flex-col overflow-hidden z-30 absolute sm:relative inset-y-0 right-0 shadow-2xl">
            {isParticipantsOpen && (
              <ParticipantsPanel
                isOpen={isParticipantsOpen}
                onClose={() => setIsParticipantsOpen(false)}
                participants={participants}
                currentUserId={user?.id || 0}
                hostUserId={meeting.host_id}
                onMuteAll={handleHostMuteAll}
                onMuteParticipant={handleHostMuteSingleParticipant}
                onRemoveParticipant={handleHostRemoveParticipant}
              />
            )}

            {isChatOpen && (
              <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Control Bar */}
      <footer className="h-16 shrink-0 bg-[#1E293B] border-t border-slate-700/60 z-20">
        <ControlBar
          isMuted={isLocalMuted}
          isVideoOff={isLocalVideoOff}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onToggleParticipants={() => {
            setIsParticipantsOpen(!isParticipantsOpen);
            setIsChatOpen(false);
          }}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
            setIsParticipantsOpen(false);
          }}
          participantsCount={1 + remoteStreams.length}
          inviteLink={meeting.invite_link || `${window.location.origin}/join/${meetingId}`}
          onLeaveMeeting={handleLeaveMeeting}
          isHost={isHost}
          onEndMeeting={handleHostEndMeeting}
        />
      </footer>
    </div>
  );
}

