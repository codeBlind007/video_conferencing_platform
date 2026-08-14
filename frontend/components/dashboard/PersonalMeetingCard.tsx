"use client";

import React, { useState } from "react";
import { UserCheck, Copy, Check } from "lucide-react";

interface PersonalMeetingCardProps {
  personalMeetingId: string;
  pmiInviteLink: string;
  onStartPmiMeeting: () => void;
}

export function PersonalMeetingCard({
  personalMeetingId,
  pmiInviteLink,
  onStartPmiMeeting,
}: PersonalMeetingCardProps) {
  const [copiedPmi, setCopiedPmi] = useState(false);

  const handleCopyPmi = () => {
    navigator.clipboard.writeText(pmiInviteLink);
    setCopiedPmi(true);
    setTimeout(() => setCopiedPmi(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center space-x-3.5">
        <div className="p-3 bg-[#F0F7FF] text-[#0E71EB] rounded-xl border border-[#0E71EB]/20 shrink-0">
          <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h4 className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Personal Meeting ID (PMI)
          </h4>
          <p className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5 truncate">
            {personalMeetingId}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
        <button
          onClick={handleCopyPmi}
          className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 flex items-center justify-center space-x-2 transition-colors"
        >
          {copiedPmi ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" />
          )}
          <span>{copiedPmi ? "Copied Link!" : "Copy Invitation"}</span>
        </button>
        <button
          onClick={onStartPmiMeeting}
          className="bg-[#0E71EB] hover:bg-[#005CE6] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-[#0E71EB]/20 text-center"
        >
          Start PMI Meeting
        </button>
      </div>
    </div>
  );
}
