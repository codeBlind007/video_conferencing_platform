"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Video, VideoOff, Mic, MicOff, AlertCircle, ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { MeetingDetailResponse } from "@/types";

export default function PreJoinPage() {
  const params = useParams();
  const meetingId = params.meetingId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [meeting, setMeeting] = useState<MeetingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 1. Fetch & Validate Meeting Details
  useEffect(() => {
    async function loadMeeting() {
      try {
        setLoading(true);
        const data = await apiRequest<MeetingDetailResponse>(`/api/meetings/${meetingId}`);
        if (!data.is_active) {
          setError("This meeting has ended or is inactive.");
        }
        setMeeting(data);
      } catch (err: any) {
        setError(err.message || "Meeting not found or invalid.");
      } finally {
        setLoading(false);
      }
    }
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  // Set default display name from session storage or authenticated user
  useEffect(() => {
    const savedName = sessionStorage.getItem(`display_name_${meetingId}`);
    if (savedName) {
      setDisplayName(savedName);
    } else if (user) {
      setDisplayName(user.name);
    }
  }, [user, meetingId]);

  // 2. Setup Local Camera/Microphone Preview Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupPreview() {
      try {
        setPermissionError("");
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMediaStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn("Camera/Microphone access error", err);
        setPermissionError("Camera/Microphone permission denied or device not found.");
        setIsCameraOn(false);
        setIsMicOn(false);
      }
    }

    setupPreview();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Video Element attachment when isCameraOn state changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, isCameraOn]);

  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const handleJoin = () => {
    if (!displayName.trim()) {
      alert("Please enter a display name to join.");
      return;
    }

    sessionStorage.setItem(`display_name_${meetingId}`, displayName.trim());
    sessionStorage.setItem(`initial_mic_${meetingId}`, isMicOn ? "on" : "off");
    sessionStorage.setItem(`initial_cam_${meetingId}`, isCameraOn ? "on" : "off");

    router.push(`/meeting/${meetingId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0E71EB]"></div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Cannot Join Meeting</h2>
          <p className="text-sm text-slate-500">{error || "Meeting details could not be retrieved."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-[#0E71EB] hover:bg-[#005CE6] text-white py-2.5 rounded-xl font-semibold text-sm transition-colors mt-2 shadow-md shadow-[#0E71EB]/20"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
          Meeting ID: <strong className="text-slate-900 font-mono">{meetingId}</strong>
        </span>
      </header>

      {/* Center Preview Content */}
      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto py-6">
        {/* Left: Camera Preview Tile (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="relative aspect-video bg-slate-900 border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex items-center justify-center">
            {isCameraOn && mediaStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center p-6">
                <div className="w-20 h-20 bg-[#0E71EB] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-xl">
                  {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                </div>
                <p className="text-sm font-medium text-slate-300">Camera is Off</p>
              </div>
            )}

            {/* Media Toggles Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xl transition-colors ${
                  isMicOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-600 text-white"
                }`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-xl transition-colors ${
                  isCameraOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-600 text-white"
                }`}
                title={isCameraOn ? "Stop Video" : "Start Video"}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {permissionError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl text-center font-medium">
              {permissionError}
            </p>
          )}
        </div>

        {/* Right: Join Info & Display Name Form (5 Cols) */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{meeting.title}</h1>
            {meeting.description && <p className="text-xs text-slate-500 mt-1">{meeting.description}</p>}
            <p className="text-xs text-slate-500 mt-2.5 flex items-center space-x-1">
              <span>Hosted by:</span>
              <strong className="text-slate-900 font-semibold">{meeting.host?.name || "Meeting Host"}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0E71EB] focus:bg-white transition-colors"
              />
            </div>

            <button
              onClick={handleJoin}
              className="w-full bg-[#0E71EB] hover:bg-[#005CE6] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#0E71EB]/20"
            >
              <LogIn className="w-5 h-5" />
              <span>Join Meeting Now</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-2">
        Zoom Clone Video Conferencing • End-to-End Encrypted WebRTC
      </footer>
    </div>
  );
}
