"use client";

import React from "react";
import { ParticipantVideo } from "./ParticipantVideo";

export interface RemoteParticipantStream {
  userId: number;
  displayName: string;
  stream: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  localDisplayName: string;
  isLocalMuted: boolean;
  isLocalVideoOff: boolean;
  remoteStreams: RemoteParticipantStream[];
  hostUserId?: number;
  currentUserId?: number;
}

export function VideoGrid({
  localStream,
  localDisplayName,
  isLocalMuted,
  isLocalVideoOff,
  remoteStreams,
  hostUserId,
  currentUserId,
}: VideoGridProps) {
  const totalCount = 1 + remoteStreams.length;

  // Compute CSS grid columns based on number of participants
  let gridCols = "grid-cols-1";
  if (totalCount === 2) {
    gridCols = "grid-cols-1 md:grid-cols-2";
  } else if (totalCount >= 3 && totalCount <= 4) {
    gridCols = "grid-cols-2";
  } else if (totalCount >= 5 && totalCount <= 9) {
    gridCols = "grid-cols-2 lg:grid-cols-3";
  } else if (totalCount > 9) {
    gridCols = "grid-cols-3 lg:grid-cols-4";
  }

  return (
    <div className={`grid ${gridCols} gap-3 w-full h-full p-3 max-w-7xl mx-auto min-h-0 min-w-0 items-center justify-center overflow-hidden`}>
      {/* Local Video Tile */}
      <div className="w-full h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
        <ParticipantVideo
          stream={localStream}
          displayName={localDisplayName}
          isLocal={true}
          isMuted={isLocalMuted}
          isVideoOff={isLocalVideoOff}
          isHost={currentUserId === hostUserId}
        />
      </div>

      {/* Remote Video Tiles */}
      {remoteStreams.map((remote) => (
        <div key={remote.userId} className="w-full h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
          <ParticipantVideo
            stream={remote.stream}
            displayName={remote.displayName}
            isLocal={false}
            isMuted={remote.isMuted}
            isVideoOff={remote.isVideoOff}
            isHost={remote.userId === hostUserId}
          />
        </div>
      ))}
    </div>
  );
}
