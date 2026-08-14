"use client";

import React from "react";
import { ChevronUp, LucideIcon } from "lucide-react";

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  activeColorClass?: string;
  badgeCount?: number;
  hasChevron?: boolean;
  onChevronClick?: () => void;
  title?: string;
  customIconContainer?: React.ReactNode;
}

export function ControlButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  activeColorClass = "text-white",
  badgeCount,
  hasChevron = true,
  onChevronClick,
  title,
  customIconContainer,
}: ControlButtonProps) {
  return (
    <div className="flex items-center space-x-0.5 group shrink-0">
      <button
        onClick={onClick}
        className={`flex flex-col items-center px-1 py-1 sm:px-3 sm:py-1.5 rounded-lg hover:bg-zinc-800 transition-colors ${
          isActive ? activeColorClass : "text-white"
        }`}
        title={title || label}
      >
        <div className="relative">
          {customIconContainer ? customIconContainer : <Icon className="w-5 h-5" />}
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-zinc-700 text-white text-[9px] font-bold px-1 rounded-full border border-black">
              {badgeCount}
            </span>
          )}
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 text-white max-w-[52px] sm:max-w-none truncate leading-tight">
          {label}
        </span>
      </button>
      {hasChevron && (
        <button
          onClick={onChevronClick || onClick}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors hidden sm:block"
          title={`${label} options`}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
