export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface Participant {
  id: number;
  meeting_id: number;
  user_id: number;
  display_name: string;
  is_muted: boolean;
  is_video_off: boolean;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
}

export interface InstantMeetingResponse {
  id: number;
  meeting_id: string;
  title: string;
  description: string | null;
  invite_link: string;
  is_instant: boolean;
  is_active: boolean;
  host_id: number;
  created_at: string;
}

export interface MeetingDetailResponse {
  id: number;
  meeting_id: string;
  title: string;
  description: string | null;
  invite_link: string;
  scheduled_at: string | null;
  duration: number | null;
  is_instant: boolean;
  is_active: boolean;
  host_id: number;
  host: User;
  created_at: string;
  active_participants_count: number;
  participants: Participant[];
}

export interface MeetingSummary {
  id: number;
  meeting_id: string;
  title: string;
  description: string | null;
  invite_link: string;
  scheduled_at: string | null;
  duration: number | null;
  is_instant: boolean;
  is_active: boolean;
  host_id: number;
  host_name: string;
  created_at: string;
  active_participants_count: number;
}

export interface RoomParticipantInfo {
  user_id: number;
  participant_id: number;
  display_name: string;
}

export type SignalingMessageType =
  | "join"
  | "offer"
  | "answer"
  | "ice-candidate"
  | "leave"
  | "room-state"
  | "participant-joined"
  | "participant-left"
  | "participant-muted"
  | "mute-all"
  | "mute-participant"
  | "participant-removed"
  | "meeting-ended"
  | "chat";

export interface SignalingMessage {
  type: SignalingMessageType;
  sender_user_id?: number;
  target_user_id?: number;
  user_id?: number;
  participant_id?: number;
  display_name?: string;
  sender?: string;
  text?: string;
  timestamp?: string;
  is_muted?: boolean;
  message?: string;
  active_participants?: RoomParticipantInfo[];
  data?: any;
}
