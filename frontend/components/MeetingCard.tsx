"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface MeetingCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorBg: string;
  onClick: () => void;
  loading?: boolean;
}

export function MeetingCard({
  title,
  description,
  icon: Icon,
  colorBg,
  onClick,
  loading = false,
}: MeetingCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-zoom-card border border-zoom-border hover:border-zoom-blue p-6 rounded-2xl text-left transition-all duration-200 hover:shadow-xl group flex flex-col justify-between w-full h-44 disabled:opacity-50"
    >
      <div className={`p-3.5 rounded-xl text-white w-fit ${colorBg} group-hover:scale-105 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white group-hover:text-zoom-blue transition-colors">
          {loading ? "Processing..." : title}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </button>
  );
}
