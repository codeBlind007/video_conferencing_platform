"use client";

import React from "react";
import { X, Mic, MicOff, UserX, VolumeX, Crown } from "lucide-react";
import { Participant } from "@/types";

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUserId: number;
  hostUserId: number;
  onMuteAll?: () => void;
  onMuteParticipant?: (participantId: number, userId: number) => void;
  onRemoveParticipant?: (participantId: number) => void;
}

export function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  currentUserId,
  hostUserId,
  onMuteAll,
  onMuteParticipant,
  onRemoveParticipant,
}: ParticipantsPanelProps) {
  if (!isOpen) return null;

  const isHost = currentUserId === hostUserId;

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-white text-slate-900">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <span>Participants</span>
          <span className="bg-slate-100 text-xs px-2.5 py-0.5 rounded-full text-slate-600 font-semibold border border-slate-200">
            {participants.length}
          </span>
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.map((p) => {
          const isParticipantHost = p.user_id === hostUserId;
          const isSelf = p.user_id === currentUserId;

          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="w-8 h-8 rounded-full bg-[#0E71EB] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                  {p.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1">
                    <span>{p.display_name}</span>
                    {isSelf && <span className="text-slate-400 font-normal">(You)</span>}
                  </p>
                  {isParticipantHost && (
                    <span className="inline-flex items-center text-[10px] text-amber-700 font-bold space-x-1">
                      <Crown className="w-3 h-3 text-amber-500" />
                      <span>Host</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Icons & Host Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                {p.is_muted ? (
                  <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Mic className="w-4 h-4 text-emerald-600" />
                )}

                {/* Host Controls for Non-Host Participants */}
                {isHost && !isParticipantHost && !isSelf && (
                  <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
                    {!p.is_muted && onMuteParticipant && (
                      <button
                        onClick={() => onMuteParticipant(p.id, p.user_id)}
                        title="Mute participant"
                        className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <VolumeX className="w-4 h-4" />
                      </button>
                    )}
                    {onRemoveParticipant && (
                      <button
                        onClick={() => onRemoveParticipant(p.id)}
                        title="Remove participant"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Controls Bottom Bar */}
      {isHost && onMuteAll && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={onMuteAll}
            className="w-full bg-white hover:bg-red-50 text-red-600 hover:border-red-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-200 shadow-xs"
          >
            <VolumeX className="w-4 h-4 text-red-500" />
            <span>Mute All Participants</span>
          </button>
        </div>
      )}
    </div>
  );
}
