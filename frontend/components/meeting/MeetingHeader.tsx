"use client";

import React from "react";

interface MeetingHeaderProps {
  title: string;
  meetingId: string;
  participantsCount: number;
}

export function MeetingHeader({
  title,
  meetingId,
  participantsCount,
}: MeetingHeaderProps) {
  return (
    <header className="h-12 shrink-0 bg-[#1E293B] px-3 sm:px-4 border-b border-slate-700/60 flex items-center justify-between z-20">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md">
          {title}
        </span>
        <span className="bg-slate-800 text-[10px] sm:text-xs font-mono px-2 py-0.5 sm:px-2.5 rounded-full text-slate-300 border border-slate-700 shrink-0">
          <span className="hidden sm:inline">ID: </span>
          {meetingId}
        </span>
      </div>
      <div className="text-[11px] sm:text-xs text-slate-300 shrink-0">
        Participants: <strong className="text-white">{participantsCount}</strong>
      </div>
    </header>
  );
}
