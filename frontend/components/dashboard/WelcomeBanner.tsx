"use client";

import React from "react";
import { Globe } from "lucide-react";

interface WelcomeBannerProps {
  userName: string;
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          {greeting}, <span className="text-[#0E71EB]">{userName}</span>
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
  );
}
