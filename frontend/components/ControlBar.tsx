"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Users,
  MessageSquare,
  Heart,
  Upload,
  ShieldCheck,
  MoreHorizontal,
  ChevronUp,
  Copy,
  Check,
  X,
} from "lucide-react";

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare?: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  participantsCount: number;
  inviteLink: string;
  onLeaveMeeting: () => void;
  isHost: boolean;
  onEndMeeting?: () => void;
  onMuteAll?: () => void;
  onSendReaction?: (emoji: string) => void;
}

export function ControlBar({
  isMuted,
  isVideoOff,
  isScreenSharing = false,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleParticipants,
  onToggleChat,
  participantsCount,
  inviteLink,
  onLeaveMeeting,
  isHost,
  onEndMeeting,
  onMuteAll,
  onSendReaction,
}: ControlBarProps) {
  const [copied, setCopied] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showHostTools, setShowHostTools] = useState(false);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMore(false);
  };

  const reactionsList = ["👍", "❤️", "👏", "😂", "🎉", "🔥"];

  return (
    <div className="w-full h-full bg-black border-t border-zinc-800 px-3 sm:px-6 flex items-center justify-between text-white select-none relative z-30">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        
        {/* Left Section: Audio & Video */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Audio Button */}
          <div className="flex items-center space-x-0.5 group">
            <button
              onClick={onToggleMic}
              className={`flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-zinc-800 transition-colors ${
                isMuted ? "text-red-500" : "text-white"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[11px] font-medium mt-0.5">{isMuted ? "Unmute" : "Audio"}</span>
            </button>
            <button
              onClick={onToggleMic}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors hidden sm:block"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Video Button */}
          <div className="flex items-center space-x-0.5 group">
            <button
              onClick={onToggleCamera}
              className={`flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-zinc-800 transition-colors ${
                isVideoOff ? "text-red-500" : "text-white"
              }`}
              title={isVideoOff ? "Start Video" : "Stop Video"}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
              <span className="text-[11px] font-medium mt-0.5">{isVideoOff ? "Start Video" : "Video"}</span>
            </button>
            <button
              onClick={onToggleCamera}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors hidden sm:block"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center Section: Participants, Chat, React, Share, Host Tools, More */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Participants */}
          <div className="flex items-center space-x-0.5">
            <button
              onClick={onToggleParticipants}
              className="relative flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-white hover:bg-zinc-800 transition-colors"
              title="Participants"
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                {participantsCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-zinc-700 text-white text-[9px] font-bold px-1 rounded-full border border-black">
                    {participantsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium mt-0.5">Participants</span>
            </button>
            <button
              onClick={onToggleParticipants}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors hidden sm:block"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Chat */}
          <div className="flex items-center space-x-0.5">
            <button
              onClick={onToggleChat}
              className="flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-white hover:bg-zinc-800 transition-colors"
              title="Chat"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-0.5">Chat</span>
            </button>
            <button
              onClick={onToggleChat}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors hidden sm:block"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* React */}
          <div className="relative flex items-center space-x-0.5">
            <button
              onClick={() => {
                setShowReactions(!showReactions);
                setShowMore(false);
                setShowHostTools(false);
              }}
              className="flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-white hover:bg-zinc-800 transition-colors"
              title="React"
            >
              <Heart className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-0.5">React</span>
            </button>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors hidden sm:block"
            >
              <ChevronUp className="w-3 h-3" />
            </button>

            {/* Reactions Floating Popup */}
            {showReactions && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-2 flex items-center space-x-2 shadow-2xl z-50">
                {reactionsList.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (onSendReaction) onSendReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share */}
          {onToggleScreenShare && (
            <div className="flex items-center space-x-0.5">
              <button
                onClick={onToggleScreenShare}
                className={`flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg transition-colors ${
                  isScreenSharing
                    ? "text-amber-400 hover:bg-zinc-800"
                    : "text-emerald-400 hover:bg-zinc-800"
                }`}
                title={isScreenSharing ? "Stop Share" : "Share"}
              >
                <div className="w-5 h-5 rounded border-2 border-current flex items-center justify-center">
                  <Upload className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-medium mt-0.5 text-white">
                  {isScreenSharing ? "Stop Share" : "Share"}
                </span>
              </button>
              <button
                onClick={onToggleScreenShare}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors hidden sm:block"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Host tools (visible to host) */}
          {isHost && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowHostTools(!showHostTools);
                  setShowReactions(false);
                  setShowMore(false);
                }}
                className="flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-white hover:bg-zinc-800 transition-colors"
                title="Host tools"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[11px] font-medium mt-0.5">Host tools</span>
              </button>

              {showHostTools && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-xl py-2 w-48 shadow-2xl z-50 text-xs">
                  {onMuteAll && (
                    <button
                      onClick={() => {
                        onMuteAll();
                        setShowHostTools(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-white font-medium transition-colors"
                    >
                      Mute All Participants
                    </button>
                  )}
                  {onEndMeeting && (
                    <button
                      onClick={() => {
                        onEndMeeting();
                        setShowHostTools(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-950/60 text-red-400 font-semibold transition-colors border-t border-zinc-800"
                    >
                      End Meeting for All
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* More (...) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMore(!showMore);
                setShowReactions(false);
                setShowHostTools(false);
              }}
              className="flex flex-col items-center p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-white hover:bg-zinc-800 transition-colors"
              title="More"
            >
              <div className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium mt-0.5">More</span>
            </button>

            {showMore && (
              <div className="absolute bottom-16 right-0 bg-zinc-900 border border-zinc-700 rounded-xl py-2 w-48 shadow-2xl z-50 text-xs">
                <button
                  onClick={handleCopyInvite}
                  className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-white font-medium flex items-center space-x-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  <span>{copied ? "Copied Link!" : "Copy Invite Link"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: End / Leave Button */}
        <div>
          {isHost && onEndMeeting ? (
            <button
              onClick={onEndMeeting}
              className="flex flex-col items-center group transition-transform hover:scale-105"
              title="End Meeting"
            >
              <div className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
                <X className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-red-500 mt-0.5">End</span>
            </button>
          ) : (
            <button
              onClick={onLeaveMeeting}
              className="flex flex-col items-center group transition-transform hover:scale-105"
              title="Leave Meeting"
            >
              <div className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
                <X className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-red-500 mt-0.5">Leave</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
