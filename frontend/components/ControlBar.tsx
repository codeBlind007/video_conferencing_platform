"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Users,
  MessageSquare,
  Copy,
  Check,
  PhoneOff,
  ShieldAlert,
} from "lucide-react";

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  participantsCount: number;
  inviteLink: string;
  onLeaveMeeting: () => void;
  isHost: boolean;
  onEndMeeting?: () => void;
}

export function ControlBar({
  isMuted,
  isVideoOff,
  onToggleMic,
  onToggleCamera,
  onToggleParticipants,
  onToggleChat,
  participantsCount,
  inviteLink,
  onLeaveMeeting,
  isHost,
  onEndMeeting,
}: ControlBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#1E293B] border-t border-slate-700/60 px-2 sm:px-4 flex items-center justify-between text-white shadow-2xl">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* Left: Audio & Video Toggles */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          <button
            onClick={onToggleMic}
            className={`flex flex-col items-center p-2 sm:px-4 sm:py-2 rounded-xl transition-all ${
              isMuted
                ? "bg-red-600 text-white hover:bg-red-700 shadow-md"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-[10px] mt-1 hidden sm:block font-medium">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          <button
            onClick={onToggleCamera}
            className={`flex flex-col items-center p-2 sm:px-4 sm:py-2 rounded-xl transition-all ${
              isVideoOff
                ? "bg-red-600 text-white hover:bg-red-700 shadow-md"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700"
            }`}
            title={isVideoOff ? "Start Video" : "Stop Video"}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-[10px] mt-1 hidden sm:block font-medium">{isVideoOff ? "Start Video" : "Stop Video"}</span>
          </button>
        </div>

        {/* Center: Meeting Controls (Participants, Chat, Share Link) */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          <button
            onClick={onToggleParticipants}
            className="relative flex flex-col items-center p-2 sm:px-4 sm:py-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
            title="Participants"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] mt-1 hidden sm:block font-medium">Participants</span>
            {participantsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#0E71EB] text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {participantsCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleChat}
            className="flex flex-col items-center p-2 sm:px-4 sm:py-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] mt-1 hidden sm:block font-medium">Chat</span>
          </button>

          <button
            onClick={handleCopyInvite}
            className="flex flex-col items-center p-2 sm:px-4 sm:py-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
            title="Copy Invite Link"
          >
            {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-[10px] mt-1 hidden sm:block font-medium">{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>

        {/* Right: Leave / Host End Meeting */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {isHost && onEndMeeting ? (
            <button
              onClick={onEndMeeting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-1 sm:space-x-1.5 transition-colors shadow-md shrink-0"
              title="End Meeting for All"
            >
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>End</span>
            </button>
          ) : (
            <button
              onClick={onLeaveMeeting}
              className="bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1 sm:space-x-1.5 transition-colors shrink-0"
              title="Leave Meeting"
            >
              <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
