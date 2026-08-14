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
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { ReactionsOverlay } from "@/components/meeting/ReactionsOverlay";

function getWebSocketUrl(meetingId: string, token: string): string {
  let baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

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

  const [meeting, setMeeting] = useState<MeetingDetailResponse | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [displayName, setDisplayName] = useState<string>("Guest");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isLocalVideoOff, setIsLocalVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnectionsRef = useRef<Map<number, PeerState>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<RemoteParticipantStream[]>([]);

  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; timestamp: string }>>([]);
  const [activeReactions, setActiveReactions] = useState<Array<{ id: string; emoji: string; sender: string }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

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

  const fetchParticipantsList = useCallback(async () => {
    try {
      const list = await apiRequest<Participant[]>(`/api/meetings/${meetingId}/participants`);
      setParticipants(list);
    } catch (e) {
      console.warn("Failed to fetch participant list", e);
    }
  }, [meetingId]);

  useEffect(() => {
    let mounted = true;

    async function initRoom() {
      try {
        const detail = await apiRequest<MeetingDetailResponse>(`/api/meetings/${meetingId}`);
        if (!mounted) return;
        if (!detail.is_active) {
          alert("This meeting has ended.");
          router.replace("/dashboard");
          return;
        }
        setMeeting(detail);

        const savedName = sessionStorage.getItem(`display_name_${meetingId}`);
        const finalName = savedName || user?.name || "Participant";
        setDisplayName(finalName);

        await apiRequest(`/api/meetings/${meetingId}/join`, {
          method: "POST",
          data: { display_name: finalName },
        });

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

        stream.getAudioTracks().forEach((t) => (t.enabled = initialMicPref));
        stream.getVideoTracks().forEach((t) => (t.enabled = initialCamPref));

        setIsLocalMuted(!initialMicPref);
        setIsLocalVideoOff(!initialCamPref);

        setLocalStream(stream);
        localStreamRef.current = stream;

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
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [meetingId, user, router, fetchParticipantsList]);

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

    const createPeer = (targetUserId: number, peerDisplayName: string, isInitiator: boolean) => {
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      console.log(`Creating RTCPeerConnection for target user ${targetUserId} (${peerDisplayName}), initiator: ${isInitiator}`);
      const pc = new RTCPeerConnection(rtcConfiguration);
      const remoteStream = new MediaStream();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

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

      pc.ontrack = (event) => {
        console.log(`Received remote track from user ${targetUserId}:`, event.track.kind);
        const activeStream = event.streams && event.streams[0] ? event.streams[0] : remoteStream;
        if (!activeStream.getTracks().some((t) => t.id === event.track.id)) {
          activeStream.addTrack(event.track);
        }
        const peerState = peerConnectionsRef.current.get(targetUserId);
        if (peerState) {
          peerState.stream = activeStream;
        }
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

    const removePeer = (targetUserId: number) => {
      const peer = peerConnectionsRef.current.get(targetUserId);
      if (peer) {
        peer.pc.close();
        peerConnectionsRef.current.delete(targetUserId);
        updateRemoteStreamsList();
      }
    };

    ws.onmessage = async (event) => {
      try {
        const msg: SignalingMessage = JSON.parse(event.data);
        console.log("Signaling Message Received:", msg.type, msg);

        switch (msg.type) {
          case "room-state":
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

          case "screen-share-state":
            updateRemoteStreamsList();
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
      peerConnectionsRef.current.forEach((peer) => peer.pc.close());
      peerConnectionsRef.current.clear();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [localStream, user, meetingId, router, fetchParticipantsList, updateRemoteStreamsList]);

  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMutedState = !audioTrack.enabled;
        setIsLocalMuted(newMutedState);

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

  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);

    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const videoTracks = localStreamRef.current.getVideoTracks().filter((t) => t !== screenTrackRef.current);
      const cameraTrack = videoTracks[0];

      const cameraStream = new MediaStream(cameraTrack ? [cameraTrack, ...audioTracks] : audioTracks);
      setLocalStream(cameraStream);
      localStreamRef.current = cameraStream;

      for (const [targetUserId, peer] of Array.from(peerConnectionsRef.current.entries())) {
        const senders = peer.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");

        if (videoSender && cameraTrack) {
          await videoSender.replaceTrack(cameraTrack);
        }

        try {
          const offer = await peer.pc.createOffer();
          await peer.pc.setLocalDescription(offer);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "offer",
                target_user_id: targetUserId,
                data: peer.pc.localDescription,
              })
            );
          }
        } catch (e) {
          console.warn("Renegotiation offer error on stopScreenShare:", e);
        }
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "screen-share-state",
          is_sharing: false,
          user_id: user?.id,
        })
      );
    }
  }, [user]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) return;

        screenTrackRef.current = screenTrack;
        setIsScreenSharing(true);

        const audioTracks = localStreamRef.current ? localStreamRef.current.getAudioTracks() : [];
        const combinedStream = new MediaStream([screenTrack, ...audioTracks]);

        setLocalStream(combinedStream);
        localStreamRef.current = combinedStream;

        for (const [targetUserId, peer] of Array.from(peerConnectionsRef.current.entries())) {
          const senders = peer.pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");

          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          } else {
            peer.pc.addTrack(screenTrack, combinedStream);
          }

          try {
            const offer = await peer.pc.createOffer();
            await peer.pc.setLocalDescription(offer);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: "offer",
                  target_user_id: targetUserId,
                  data: peer.pc.localDescription,
                })
              );
            }
          } catch (e) {
            console.warn("Renegotiation offer error on handleToggleScreenShare:", e);
          }
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "screen-share-state",
              is_sharing: true,
              user_id: user?.id,
            })
          );
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled or error:", err);
      }
    }
  };

  const handleSendReaction = (emoji: string) => {
    const reactionObj = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      emoji,
      sender: displayName,
    };
    setActiveReactions((prev) => [...prev, reactionObj]);
    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== reactionObj.id));
    }, 3000);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          text: `reacted ${emoji}`,
          sender: displayName,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })
      );
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
      <MeetingHeader
        title={meeting.title}
        meetingId={meetingId}
        participantsCount={1 + remoteStreams.length}
      />

      <main className="flex-1 min-h-0 min-w-0 flex flex-row overflow-hidden relative">
        <div className="flex-1 min-h-0 min-w-0 bg-[#0B0F17] flex items-center justify-center overflow-hidden relative">
          <VideoGrid
            localStream={localStream}
            localDisplayName={displayName}
            isLocalMuted={isLocalMuted}
            isLocalVideoOff={isLocalVideoOff}
            isLocalScreenSharing={isScreenSharing}
            remoteStreams={remoteStreams}
            hostUserId={meeting.host_id}
            currentUserId={user?.id}
          />

          <ReactionsOverlay reactions={activeReactions} />
        </div>

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

      <footer className="h-16 shrink-0 bg-black border-t border-zinc-800 z-20">
        <ControlBar
          isMuted={isLocalMuted}
          isVideoOff={isLocalVideoOff}
          isScreenSharing={isScreenSharing}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onToggleScreenShare={handleToggleScreenShare}
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
          onMuteAll={handleHostMuteAll}
          onSendReaction={handleSendReaction}
        />
      </footer>
    </div>
  );
}
