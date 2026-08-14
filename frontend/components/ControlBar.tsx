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
  Copy,
  Check,
  X,
} from "lucide-react";
import { ControlButton } from "@/components/ui/ControlButton";
import { ReactionsMenu } from "@/components/meeting/ReactionsMenu";

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

  return (
    <div className="w-full h-full bg-black border-t border-zinc-800 px-2 sm:px-6 flex items-center justify-between text-white select-none relative z-30 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between space-x-1 sm:space-x-4 min-w-0">
        <div className="flex items-center space-x-1 sm:space-x-4 shrink-0">
          <ControlButton
            icon={isMuted ? MicOff : Mic}
            label={isMuted ? "Unmute" : "Audio"}
            onClick={onToggleMic}
            isActive={isMuted}
            activeColorClass="text-red-500"
            title={isMuted ? "Unmute" : "Mute"}
          />
          <ControlButton
            icon={isVideoOff ? VideoOff : VideoIcon}
            label={isVideoOff ? "Start Video" : "Video"}
            onClick={onToggleCamera}
            isActive={isVideoOff}
            activeColorClass="text-red-500"
            title={isVideoOff ? "Start Video" : "Stop Video"}
          />
        </div>

        <div className="flex items-center space-x-0.5 sm:space-x-3 overflow-x-auto no-scrollbar shrink-0">
          <ControlButton
            icon={Users}
            label="Participants"
            onClick={onToggleParticipants}
            badgeCount={participantsCount}
          />
          <ControlButton
            icon={MessageSquare}
            label="Chat"
            onClick={onToggleChat}
          />

          <div className="relative shrink-0">
            <ControlButton
              icon={Heart}
              label="React"
              onClick={() => {
                setShowReactions(!showReactions);
                setShowMore(false);
                setShowHostTools(false);
              }}
            />
            <ReactionsMenu
              isOpen={showReactions}
              onSelectReaction={(emoji) => {
                if (onSendReaction) onSendReaction(emoji);
                setShowReactions(false);
              }}
            />
          </div>

          {onToggleScreenShare && (
            <ControlButton
              icon={Upload}
              label={isScreenSharing ? "Stop Share" : "Share"}
              onClick={onToggleScreenShare}
              isActive={isScreenSharing}
              activeColorClass="text-amber-400"
              customIconContainer={
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isScreenSharing ? "border-amber-400 text-amber-400" : "border-emerald-400 text-emerald-400"
                  }`}
                >
                  <Upload className="w-3 h-3 stroke-[2.5]" />
                </div>
              }
            />
          )}

          {isHost && (
            <div className="relative shrink-0">
              <ControlButton
                icon={ShieldCheck}
                label="Host tools"
                onClick={() => {
                  setShowHostTools(!showHostTools);
                  setShowReactions(false);
                  setShowMore(false);
                }}
                hasChevron={false}
              />
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

          <div className="relative shrink-0">
            <ControlButton
              icon={MoreHorizontal}
              label="More"
              onClick={() => {
                setShowMore(!showMore);
                setShowReactions(false);
                setShowHostTools(false);
              }}
              hasChevron={false}
              customIconContainer={
                <div className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </div>
              }
            />

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

        <div className="shrink-0 pl-1">
          <button
            onClick={isHost && onEndMeeting ? onEndMeeting : onLeaveMeeting}
            className="flex flex-col items-center group transition-transform hover:scale-105"
            title={isHost ? "End Meeting" : "Leave Meeting"}
          >
            <div className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
              <X className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-red-500 mt-0.5">
              {isHost ? "End" : "Leave"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
