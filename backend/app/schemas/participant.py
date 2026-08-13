from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class JoinMeetingRequest(BaseModel):
    display_name: str | None = Field(default=None, max_length=100, description="Optional display name for joining")


class ParticipantMuteRequest(BaseModel):
    is_muted: bool = Field(..., description="Mute state")


class ParticipantResponse(BaseModel):
    id: int
    meeting_id: int
    user_id: int
    display_name: str
    is_muted: bool
    is_video_off: bool
    is_active: bool
    joined_at: datetime
    left_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
