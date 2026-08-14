"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bgColorClass: string;
  shadowColorClass: string;
  hoverBorderClass: string;
  hoverTextClass: string;
  onClick: () => void;
  disabled?: boolean;
}

export function QuickActionCard({
  title,
  subtitle,
  icon: Icon,
  bgColorClass,
  shadowColorClass,
  hoverBorderClass,
  hoverTextClass,
  onClick,
  disabled = false,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-white border border-slate-200 ${hoverBorderClass} p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between h-32 sm:h-36 group transition-all shadow-sm hover:shadow-md disabled:opacity-50`}
    >
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${bgColorClass} flex items-center justify-center text-white ${shadowColorClass} group-hover:scale-105 transition-transform`}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div>
        <h3
          className={`font-bold text-slate-900 text-sm sm:text-base ${hoverTextClass} transition-colors`}
        >
          {title}
        </h3>
        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
          {subtitle}
        </p>
      </div>
    </button>
  );
}
