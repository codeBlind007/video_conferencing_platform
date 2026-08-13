"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Video,
  Calendar,
  Disc,
  FileText,
  Layout,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Meetings", href: "/dashboard", icon: Video },
    { name: "Recordings", href: "#", icon: Disc },
    { name: "Whiteboards", href: "#", icon: Layout },
    { name: "Notes", href: "#", icon: FileText },
    { name: "Scheduler", href: "#", icon: Calendar },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`bg-white border-r border-slate-200 flex-col justify-between shrink-0 text-slate-700 shadow-sm transition-all duration-300 ${
          mobileOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 flex h-full shadow-2xl"
            : "hidden md:flex md:w-60 md:h-screen md:sticky md:top-0"
        }`}
      >
        {/* Top Logo & Main Nav */}
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <Link
              href="/dashboard"
              onClick={onMobileClose}
              className="flex items-center space-x-2.5"
            >
              <div className="bg-[#0E71EB] p-2 rounded-xl text-white shadow-md shadow-[#0E71EB]/20">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                zoom
                <span className="text-[#0E71EB] font-normal text-xs ml-1 uppercase border border-[#0E71EB]/30 px-1.5 py-0.5 rounded bg-[#F0F7FF]">
                  Workplace
                </span>
              </span>
            </Link>

            {/* Mobile Close Button */}
            {onMobileClose && (
              <button
                onClick={onMobileClose}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                title="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Section Header */}
          <div className="px-6 pt-6 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            My Products
          </div>

          {/* Nav Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href && item.name === "Home";
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#F0F7FF] text-[#0E71EB] font-bold border border-[#0E71EB]/20 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#0E71EB]" : "text-slate-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile / Quick Settings */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <button
            onClick={() => alert("Zoom Workplace Settings")}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          {user && (
            <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#0E71EB] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
