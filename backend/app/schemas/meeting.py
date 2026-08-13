from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.auth import UserResponse
from app.schemas.participant import ParticipantResponse


class InstantMeetingCreate(BaseModel):
    title: str = Field(default="Instant Meeting", max_length=255, description="Title of the instant meeting")
    description: str | None = Field(default=None, description="Optional meeting description")


class ScheduleMeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Title of the scheduled meeting")
    description: str | None = Field(default=None, description="Optional meeting description")
    scheduled_at: datetime = Field(..., description="Future date and time for the meeting")
    duration: int = Field(..., gt=0, description="Duration in minutes")


class InstantMeetingResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: str | None = None
    invite_link: str
    is_instant: bool
    is_active: bool
    host_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MeetingDetailResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: str | None = None
    invite_link: str
    scheduled_at: datetime | None = None
    duration: int | None = None
    is_instant: bool
    is_active: bool
    host_id: int
    host: UserResponse
    created_at: datetime
    active_participants_count: int = 0
    participants: list[ParticipantResponse] = []

    model_config = ConfigDict(from_attributes=True)


class MeetingSummaryResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: str | None = None
    invite_link: str
    scheduled_at: datetime | None = None
    duration: int | None = None
    is_instant: bool
    is_active: bool
    host_id: int
    host_name: str
    created_at: datetime
    active_participants_count: int = 0

    model_config = ConfigDict(from_attributes=True)
