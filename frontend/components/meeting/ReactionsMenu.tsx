"use client";

import React from "react";

interface ReactionsMenuProps {
  isOpen: boolean;
  onSelectReaction: (emoji: string) => void;
}

const DEFAULT_REACTIONS = ["👍", "❤️", "👏", "😂", "🎉", "🔥"];

export function ReactionsMenu({ isOpen, onSelectReaction }: ReactionsMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-2 flex items-center space-x-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
      {DEFAULT_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelectReaction(emoji)}
          className="text-xl hover:scale-125 transition-transform p-1"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
