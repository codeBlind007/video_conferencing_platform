"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Video,
  Calendar,
  HelpCircle,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
  Crown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { JoinModal } from "./JoinModal";
import { ScheduleModal } from "./ScheduleModal";

interface NavbarProps {
  onNewMeeting?: () => void;
  onRefreshData?: () => void;
}

export function Navbar({ onNewMeeting, onRefreshData }: NavbarProps) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHostDropdown, setShowHostDropdown] = useState(false);

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="h-16 px-6 flex items-center justify-between">
          {/* Left: Search Input Bar */}
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search meetings, contacts, recordings..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0E71EB] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Right: Quick Action Buttons & Profile */}
          <div className="flex items-center space-x-3">
            {/* Schedule Quick Action */}
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-200"
            >
              <Calendar className="w-3.5 h-3.5 text-[#0E71EB]" />
              <span>Schedule</span>
            </button>

            {/* Join Quick Action */}
            <button
              onClick={() => setIsJoinOpen(true)}
              className="bg-[#0E71EB] hover:bg-[#005CE6] text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-colors shadow-md shadow-[#0E71EB]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Join</span>
            </button>

            {/* Host Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowHostDropdown(!showHostDropdown)}
                className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-colors shadow-md shadow-[#F97316]/20"
              >
                <Video className="w-4 h-4" />
                <span>Host</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showHostDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                  <button
                    onClick={() => {
                      setShowHostDropdown(false);
                      if (onNewMeeting) onNewMeeting();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
                  >
                    With Video On
                  </button>
                  <button
                    onClick={() => {
                      setShowHostDropdown(false);
                      if (onNewMeeting) onNewMeeting();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
                  >
                    With Video Off
                  </button>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            {/* Notifications & Help */}
            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* User Profile Avatar */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-full bg-[#0E71EB] flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-3 z-50 text-xs">
                    <div className="px-4 pb-3 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                      <span className="inline-flex items-center space-x-1 mt-1.5 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span>Basic License</span>
                      </span>
                    </div>

                    <div className="py-2 border-b border-slate-100">
                      <button
                        onClick={() => alert("Settings modal")}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2.5 transition-colors font-medium"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Settings</span>
                      </button>
                    </div>

                    <div className="pt-2 px-2">
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl flex items-center space-x-2.5 transition-colors font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <JoinModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </>
  );
}
