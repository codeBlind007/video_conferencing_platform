"use client";

import React from "react";

export interface ActiveReaction {
  id: string;
  emoji: string;
  sender: string;
}

interface ReactionsOverlayProps {
  reactions: ActiveReaction[];
}

export function ReactionsOverlay({ reactions }: ReactionsOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-6 flex flex-col space-y-2 z-40 pointer-events-none">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="animate-bounce bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-full text-lg border border-zinc-700 text-white flex items-center space-x-2 shadow-2xl"
        >
          <span>{r.emoji}</span>
          <span className="text-xs font-semibold text-zinc-200">{r.sender}</span>
        </div>
      ))}
    </div>
  );
}
