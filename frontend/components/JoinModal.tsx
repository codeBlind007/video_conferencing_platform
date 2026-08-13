"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinModal({ isOpen, onClose }: JoinModalProps) {
  const [meetingInput, setMeetingInput] = useState("");
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [error, setError] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!meetingInput.trim()) {
      setError("Please enter a valid Meeting ID or Invite Link");
      return;
    }

    let extractedId = meetingInput.trim();
    if (extractedId.includes("/join/")) {
      extractedId = extractedId.split("/join/")[1].split("?")[0];
    }

    if (displayName.trim()) {
      sessionStorage.setItem(`display_name_${extractedId}`, displayName.trim());
    }

    onClose();
    router.push(`/join/${extractedId}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#0E71EB] p-2.5 rounded-2xl text-white shadow-md shadow-[#0E71EB]/20">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Join a Meeting</h2>
            <p className="text-xs text-slate-500">Enter a Meeting ID or invite URL</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meeting ID or Invite Link
            </label>
            <input
              type="text"
              placeholder="e.g. abc-def-ghi or http://localhost:3000/join/abc-def-ghi"
              value={meetingInput}
              onChange={(e) => setMeetingInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0E71EB] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0E71EB] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#0E71EB] hover:bg-[#005CE6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md shadow-[#0E71EB]/20"
            >
              Join Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
