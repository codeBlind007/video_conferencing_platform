"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Copy,
  Check,
  Play,
  Monitor,
  Globe,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { JoinModal } from "@/components/JoinModal";
import { ScheduleModal } from "@/components/ScheduleModal";
import { apiRequest } from "@/lib/api";
import { MeetingSummary, InstantMeetingResponse } from "@/types";

function formatLocalTime(dateStr: string | null): string {
  if (!dateStr) return "Flexible";
  const utcStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`;
  return new Date(utcStr).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingSummary[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<MeetingSummary[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "recent">("upcoming");

  const [loadingData, setLoadingData] = useState(true);
  const [creatingInstant, setCreatingInstant] = useState(false);

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPmi, setCopiedPmi] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Personal Meeting ID (PMI) derived consistently from user ID
  const personalMeetingId = user ? `pmi-${1000 + user.id}` : "pmi-1001";
  const pmiInviteLink = `http://localhost:3000/join/${personalMeetingId}`;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoadingData(true);
      const [upcomingData, recentData] = await Promise.all([
        apiRequest<MeetingSummary[]>("/api/meetings/upcoming"),
        apiRequest<MeetingSummary[]>("/api/meetings/recent"),
      ]);
      setUpcomingMeetings(upcomingData);
      setRecentMeetings(recentData);
    } catch (err) {
      console.error("Failed to load meetings", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleNewMeeting = async () => {
    try {
      setCreatingInstant(true);
      const meeting = await apiRequest<InstantMeetingResponse>("/api/meetings/instant", {
        method: "POST",
      });
      router.push(`/meeting/${meeting.meeting_id}`);
    } catch (err) {
      setCreatingInstant(false);
      alert("Failed to start new meeting. Please try again.");
    }
  };

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyPmi = () => {
    navigator.clipboard.writeText(pmiInviteLink);
    setCopiedPmi(true);
    setTimeout(() => setCopiedPmi(false), 2000);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0E71EB]"></div>
      </div>
    );
  }

  // Time-aware greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Left Sidebar */}
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onNewMeeting={handleNewMeeting}
          onRefreshData={fetchDashboardData}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Welcome Banner */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                {greeting}, <span className="text-[#0E71EB]">{user.name}</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="hidden sm:flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 shadow-xs">
              <Globe className="w-4 h-4 text-[#0E71EB]" />
              <span>Zoom Web Client</span>
            </div>
          </div>

          {/* Hero Action Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* New Meeting Button */}
            <button
              onClick={handleNewMeeting}
              disabled={creatingInstant}
              className="bg-white border border-slate-200 hover:border-[#F97316] p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between h-32 sm:h-36 group transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-md shadow-[#F97316]/20 group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#F97316] transition-colors">
                  {creatingInstant ? "Starting..." : "New Meeting"}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Start instant video call</p>
              </div>
            </button>

            {/* Join Meeting Button */}
            <button
              onClick={() => setIsJoinOpen(true)}
              className="bg-white border border-slate-200 hover:border-[#0E71EB] p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between h-32 sm:h-36 group transition-all shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0E71EB] flex items-center justify-center text-white shadow-md shadow-[#0E71EB]/20 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#0E71EB] transition-colors">
                  Join Meeting
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Join with ID or link</p>
              </div>
            </button>

            {/* Schedule Meeting Button */}
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="bg-white border border-slate-200 hover:border-[#7C3AED] p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between h-32 sm:h-36 group transition-all shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-[#7C3AED]/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#7C3AED] transition-colors">
                  Schedule
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Plan a future meeting</p>
              </div>
            </button>

            {/* Share Screen Button */}
            <button
              onClick={() => setIsJoinOpen(true)}
              className="bg-white border border-slate-200 hover:border-emerald-500 p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between h-32 sm:h-36 group transition-all shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-600 transition-colors">
                  Share Screen
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Share content in room</p>
              </div>
            </button>
          </div>

          {/* Personal Meeting ID (PMI) Banner Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-[#F0F7FF] text-[#0E71EB] rounded-xl border border-[#0E71EB]/20 shrink-0">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Personal Meeting ID (PMI)
                </h4>
                <p className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5 truncate">{personalMeetingId}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={handleCopyPmi}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 flex items-center justify-center space-x-2 transition-colors"
              >
                {copiedPmi ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedPmi ? "Copied Link!" : "Copy Invitation"}</span>
              </button>
              <button
                onClick={() => router.push(`/join/${personalMeetingId}`)}
                className="bg-[#0E71EB] hover:bg-[#005CE6] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-[#0E71EB]/20 text-center"
              >
                Start PMI Meeting
              </button>
            </div>
          </div>

          {/* Meetings Navigation Tabs */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center justify-between">
              <div className="flex space-x-4 sm:space-x-6 min-w-max">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                    activeTab === "upcoming"
                      ? "border-[#0E71EB] text-[#0E71EB]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming Meetings ({upcomingMeetings.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("recent")}
                  className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                    activeTab === "recent"
                      ? "border-[#0E71EB] text-[#0E71EB]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Recent History ({recentMeetings.length})</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "upcoming" ? (
              loadingData ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading upcoming meetings...</div>
              ) : upcomingMeetings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center shadow-xs">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">No Upcoming Meetings</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You have no scheduled meetings coming up. Click Schedule to set up a new meeting.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white border border-slate-200 hover:border-[#0E71EB]/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{m.title}</h3>
                          {m.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>}
                        </div>
                        <span className="bg-[#F0F7FF] text-[#0E71EB] text-xs font-mono font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#0E71EB]/20 shrink-0">
                          {m.meeting_id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 flex-wrap gap-2">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span className="flex items-center space-x-1.5 text-slate-700 font-medium text-xs">
                            <Clock className="w-3.5 h-3.5 text-[#0E71EB]" />
                            <span>{formatLocalTime(m.scheduled_at)}</span>
                          </span>
                          {m.duration && <span className="text-slate-400">• {m.duration}m</span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyLink(m.invite_link, m.meeting_id)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                            title="Copy Invite"
                          >
                            {copiedId === m.meeting_id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => router.push(`/join/${m.meeting_id}`)}
                            className="bg-[#0E71EB] hover:bg-[#005CE6] text-white px-3.5 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors text-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : loadingData ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading recent history...</div>
            ) : recentMeetings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center shadow-xs">
                <p className="text-sm font-semibold text-slate-700">No Recent Meetings</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                {recentMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 sm:p-4 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        <Video className="w-4 h-4 text-[#0E71EB]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{m.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span>Host: {m.host_name}</span>
                          <span>•</span>
                          <span>{new Date(m.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {m.meeting_id}
                      </span>
                      <button
                        onClick={() => router.push(`/join/${m.meeting_id}`)}
                        className="text-xs font-semibold text-[#0E71EB] hover:text-white px-3 py-1.5 rounded-xl border border-[#0E71EB]/40 hover:bg-[#0E71EB] transition-colors"
                      >
                        Rejoin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <JoinModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
