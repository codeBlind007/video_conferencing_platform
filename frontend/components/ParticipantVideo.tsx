"use client";

import React, { useEffect, useRef } from "react";
import { MicOff, User } from "lucide-react";

interface ParticipantVideoProps {
  stream?: MediaStream | null;
  displayName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHost?: boolean;
}

export function ParticipantVideo({
  stream,
  displayName,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isHost = false,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream, isVideoOff]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks()[0].enabled &&
    !isVideoOff;

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 max-h-full max-w-full bg-[#1E293B] border border-slate-700/60 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg group">
      {/* Video Element (Always mounted to preserve stream srcObject binding) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video element to prevent echo feedback
        className={`w-full h-full max-h-full max-w-full object-contain ${
          isLocal ? "scale-x-[-1]" : ""
        } ${hasVideoTrack ? "block" : "hidden"}`}
      />

      {/* Camera Off Avatar Fallback */}
      {!hasVideoTrack && (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 rounded-full bg-[#0E71EB] flex items-center justify-center text-white text-2xl font-bold shadow-xl mb-2">
            {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>
          <p className="text-sm font-medium text-gray-300">{displayName}</p>
        </div>
      )}

      {/* Top Host Badge */}
      {isHost && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-amber-400 border border-amber-500/30">
          Host
        </div>
      )}

      {/* Mute Indicator (Top Right) */}
      {isMuted && (
        <div className="absolute top-3 right-3 bg-red-600/90 text-white p-1.5 rounded-lg shadow-md">
          <MicOff className="w-4 h-4" />
        </div>
      )}

      {/* Name Tag (Bottom Left) */}
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs text-white font-medium flex items-center space-x-1.5 border border-white/10">
        <span>{displayName} {isLocal && "(You)"}</span>
      </div>
    </div>
  );
}
