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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { JoinModal } from "@/components/JoinModal";
import { ScheduleModal } from "@/components/ScheduleModal";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { PersonalMeetingCard } from "@/components/dashboard/PersonalMeetingCard";
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    } catch (err: any) {
      console.error("Failed to load meetings", err);
      if (err.message && err.message.toLowerCase().includes("credentials")) {
        localStorage.removeItem("zoom_clone_user");
        localStorage.removeItem("zoom_clone_token");
        router.replace("/login");
      }
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
        data: {},
      });
      router.push(`/meeting/${meeting.meeting_id}`);
    } catch (err: any) {
      setCreatingInstant(false);
      alert(err.message || "Failed to start new meeting. Please try again.");
    }
  };

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0E71EB]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onNewMeeting={handleNewMeeting}
          onRefreshData={fetchDashboardData}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <WelcomeBanner userName={user.name} />

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <QuickActionCard
              title={creatingInstant ? "Starting..." : "New Meeting"}
              subtitle="Start instant video call"
              icon={Video}
              bgColorClass="bg-[#F97316]"
              shadowColorClass="shadow-md shadow-[#F97316]/20"
              hoverBorderClass="hover:border-[#F97316]"
              hoverTextClass="group-hover:text-[#F97316]"
              onClick={handleNewMeeting}
              disabled={creatingInstant}
            />

            <QuickActionCard
              title="Join Meeting"
              subtitle="Join with ID or link"
              icon={Plus}
              bgColorClass="bg-[#0E71EB]"
              shadowColorClass="shadow-md shadow-[#0E71EB]/20"
              hoverBorderClass="hover:border-[#0E71EB]"
              hoverTextClass="group-hover:text-[#0E71EB]"
              onClick={() => setIsJoinOpen(true)}
            />

            <QuickActionCard
              title="Schedule"
              subtitle="Plan a future meeting"
              icon={Calendar}
              bgColorClass="bg-[#7C3AED]"
              shadowColorClass="shadow-md shadow-[#7C3AED]/20"
              hoverBorderClass="hover:border-[#7C3AED]"
              hoverTextClass="group-hover:text-[#7C3AED]"
              onClick={() => setIsScheduleOpen(true)}
            />

            <QuickActionCard
              title="Share Screen"
              subtitle="Share content in room"
              icon={Monitor}
              bgColorClass="bg-emerald-600"
              shadowColorClass="shadow-md shadow-emerald-600/20"
              hoverBorderClass="hover:border-emerald-500"
              hoverTextClass="group-hover:text-emerald-600"
              onClick={() => setIsJoinOpen(true)}
            />
          </div>

          <PersonalMeetingCard
            personalMeetingId={personalMeetingId}
            pmiInviteLink={pmiInviteLink}
            onStartPmiMeeting={() => router.push(`/join/${personalMeetingId}`)}
          />

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

      <JoinModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
