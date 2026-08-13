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
    <div className="relative w-full h-full min-h-0 min-w-0 max-h-full max-w-full bg-[#1E293B] border border-slate-700/60 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center shadow-lg group">
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
        <div className="flex flex-col items-center justify-center p-3 sm:p-4">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#0E71EB] flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl mb-1.5 sm:mb-2">
            {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-8 h-8 sm:w-10 sm:h-10" />}
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-300 truncate max-w-[120px] sm:max-w-xs">{displayName}</p>
        </div>
      )}

      {/* Top Host Badge */}
      {isHost && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold text-amber-400 border border-amber-500/30">
          Host
        </div>
      )}

      {/* Mute Indicator (Top Right) */}
      {isMuted && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-600/90 text-white p-1 sm:p-1.5 rounded-lg shadow-md">
          <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      )}

      {/* Name Tag (Bottom Left) */}
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/70 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[10px] sm:text-xs text-white font-medium flex items-center space-x-1 border border-white/10 max-w-[calc(100%-1rem)]">
        <span className="truncate">{displayName} {isLocal && "(You)"}</span>
      </div>
    </div>
  );
}
