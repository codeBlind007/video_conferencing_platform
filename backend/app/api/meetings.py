import secrets
import string
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database.database import get_db
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.schemas.auth import UserResponse
from app.schemas.meeting import (
    InstantMeetingCreate,
    ScheduleMeetingCreate,
    InstantMeetingResponse,
    MeetingDetailResponse,
    MeetingSummaryResponse
)
from app.schemas.participant import (
    JoinMeetingRequest,
    ParticipantResponse
)
from app.core.security import get_current_user
from app.api.ws import manager

router = APIRouter(
    prefix="/api/meetings",
    tags=["Meetings"]
)


def generate_meeting_id() -> str:
    """Generates a URL-safe meeting ID in format 'abc-def-ghi'."""
    chars = string.ascii_lowercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(3))
    part2 = ''.join(secrets.choice(chars) for _ in range(3))
    part3 = ''.join(secrets.choice(chars) for _ in range(3))
    return f"{part1}-{part2}-{part3}"


def create_unique_meeting_id(db: Session) -> str:
    """Ensures generated meeting ID is unique in the database before returning."""
    while True:
        meeting_id = generate_meeting_id()
        existing = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
        if not existing:
            return meeting_id


def ensure_utc(dt: datetime | None) -> datetime | None:
    """Ensures naive UTC datetimes carry timezone.utc info for proper ISO serialization."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# -----------------------------------------------------------------------------
# 1. FIXED PATH ROUTES (Must come before /{meeting_id} dynamic routes)
# -----------------------------------------------------------------------------

@router.post("/instant", response_model=InstantMeetingResponse, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    meeting_in: InstantMeetingCreate = InstantMeetingCreate(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates an instant meeting for the authenticated user."""
    meeting_id = create_unique_meeting_id(db)

    new_meeting = Meeting(
        meeting_id=meeting_id,
        title=meeting_in.title,
        description=meeting_in.description,
        host_id=current_user.id,
        is_instant=True,
        is_active=True
    )

    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    invite_link = f"http://localhost:3000/join/{new_meeting.meeting_id}"

    return InstantMeetingResponse(
        id=new_meeting.id,
        meeting_id=new_meeting.meeting_id,
        title=new_meeting.title,
        description=new_meeting.description,
        invite_link=invite_link,
        is_instant=new_meeting.is_instant,
        is_active=new_meeting.is_active,
        host_id=new_meeting.host_id,
        created_at=ensure_utc(new_meeting.created_at)
    )


@router.post("/schedule", response_model=InstantMeetingResponse, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    meeting_in: ScheduleMeetingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Schedules a future meeting for the authenticated user."""
    scheduled_at = meeting_in.scheduled_at
    now = datetime.now(timezone.utc) if scheduled_at.tzinfo is not None else datetime.utcnow()

    if scheduled_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scheduled time must be in the future"
        )

    # Convert to naive UTC for consistent SQLite storage
    if scheduled_at.tzinfo is not None:
        scheduled_at = scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)

    meeting_id = create_unique_meeting_id(db)

    new_meeting = Meeting(
        meeting_id=meeting_id,
        title=meeting_in.title,
        description=meeting_in.description,
        scheduled_at=scheduled_at,
        duration=meeting_in.duration,
        host_id=current_user.id,
        is_instant=False,
        is_active=True
    )

    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    invite_link = f"http://localhost:3000/join/{new_meeting.meeting_id}"

    return InstantMeetingResponse(
        id=new_meeting.id,
        meeting_id=new_meeting.meeting_id,
        title=new_meeting.title,
        description=new_meeting.description,
        invite_link=invite_link,
        is_instant=new_meeting.is_instant,
        is_active=new_meeting.is_active,
        host_id=new_meeting.host_id,
        created_at=ensure_utc(new_meeting.created_at)
    )


@router.get("/upcoming", response_model=list[MeetingSummaryResponse])
def get_upcoming_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns future scheduled meetings hosted or joined by the current user."""
    now = datetime.utcnow()
    meetings = (
        db.query(Meeting)
        .filter(
            Meeting.is_active == True,
            Meeting.is_instant == False,
            Meeting.scheduled_at >= now,
            or_(
                Meeting.host_id == current_user.id,
                Meeting.participants.any(Participant.user_id == current_user.id)
            )
        )
        .order_by(Meeting.scheduled_at.asc())
        .all()
    )

    results = []
    for m in meetings:
        active_count = db.query(Participant).filter(Participant.meeting_id == m.id, Participant.is_active == True).count()
        results.append(
            MeetingSummaryResponse(
                id=m.id,
                meeting_id=m.meeting_id,
                title=m.title,
                description=m.description,
                invite_link=f"http://localhost:3000/join/{m.meeting_id}",
                scheduled_at=ensure_utc(m.scheduled_at),
                duration=m.duration,
                is_instant=m.is_instant,
                is_active=m.is_active,
                host_id=m.host_id,
                host_name=m.host.name if m.host else "Unknown Host",
                created_at=ensure_utc(m.created_at),
                active_participants_count=active_count
            )
        )
    return results


@router.get("/recent", response_model=list[MeetingSummaryResponse])
def get_recent_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns meetings hosted or joined by the current user, ordered by latest activity."""
    meetings = (
        db.query(Meeting)
        .filter(
            or_(
                Meeting.host_id == current_user.id,
                Meeting.participants.any(Participant.user_id == current_user.id)
            )
        )
        .order_by(desc(Meeting.created_at))
        .all()
    )

    results = []
    for m in meetings:
        active_count = db.query(Participant).filter(Participant.meeting_id == m.id, Participant.is_active == True).count()
        results.append(
            MeetingSummaryResponse(
                id=m.id,
                meeting_id=m.meeting_id,
                title=m.title,
                description=m.description,
                invite_link=f"http://localhost:3000/join/{m.meeting_id}",
                scheduled_at=ensure_utc(m.scheduled_at),
                duration=m.duration,
                is_instant=m.is_instant,
                is_active=m.is_active,
                host_id=m.host_id,
                host_name=m.host.name if m.host else "Unknown Host",
                created_at=ensure_utc(m.created_at),
                active_participants_count=active_count
            )
        )
    return results


# -----------------------------------------------------------------------------
# 2. DYNAMIC PATH ROUTES ({meeting_id})
# -----------------------------------------------------------------------------

@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting_details(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches details for a given meeting along with host and active participants."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    active_participants = (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id, Participant.is_active == True)
        .all()
    )

    return MeetingDetailResponse(
        id=meeting.id,
        meeting_id=meeting.meeting_id,
        title=meeting.title,
        description=meeting.description,
        invite_link=f"http://localhost:3000/join/{meeting.meeting_id}",
        scheduled_at=meeting.scheduled_at,
        duration=meeting.duration,
        is_instant=meeting.is_instant,
        is_active=meeting.is_active,
        host_id=meeting.host_id,
        host=UserResponse.model_validate(meeting.host),
        created_at=meeting.created_at,
        active_participants_count=len(active_participants),
        participants=[ParticipantResponse.model_validate(p) for p in active_participants]
    )


@router.post("/{meeting_id}/join", response_model=ParticipantResponse, status_code=status.HTTP_200_OK)
def join_meeting(
    meeting_id: str,
    join_in: JoinMeetingRequest = JoinMeetingRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Joins a meeting using meeting ID. Validates active status and records participant."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    if not meeting.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting has ended or is inactive"
        )

    display_name = join_in.display_name.strip() if join_in.display_name else current_user.name

    # Check for existing participant record
    existing_participant = (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id, Participant.user_id == current_user.id)
        .first()
    )

    if existing_participant:
        existing_participant.is_active = True
        existing_participant.joined_at = datetime.utcnow()
        existing_participant.left_at = None
        existing_participant.display_name = display_name
        participant = existing_participant
    else:
        participant = Participant(
            meeting_id=meeting.id,
            user_id=current_user.id,
            display_name=display_name,
            is_active=True,
            is_muted=False
        )
        db.add(participant)

    db.commit()
    db.refresh(participant)

    return ParticipantResponse.model_validate(participant)


@router.post("/{meeting_id}/leave")
def leave_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leaves an active meeting and records exit timestamp."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    participant = (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id, Participant.user_id == current_user.id, Participant.is_active == True)
        .first()
    )

    if participant:
        participant.is_active = False
        participant.left_at = datetime.utcnow()
        db.commit()

    return {"message": "Left meeting successfully"}


# -----------------------------------------------------------------------------
# 3. HOST CONTROLS & MANAGEMENT
# -----------------------------------------------------------------------------

@router.get("/{meeting_id}/participants", response_model=list[ParticipantResponse])
def get_meeting_participants(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all active participants for a meeting."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    participants = (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id, Participant.is_active == True)
        .all()
    )

    return [ParticipantResponse.model_validate(p) for p in participants]


@router.patch("/{meeting_id}/end")
async def end_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Host control: Ends meeting, marks all participants inactive, and notifies WebSocket clients."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    if meeting.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the meeting host can end the meeting"
        )

    meeting.is_active = False
    now = datetime.utcnow()

    # Mark all active participants as left
    active_participants = (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id, Participant.is_active == True)
        .all()
    )
    for p in active_participants:
        p.is_active = False
        p.left_at = now

    db.commit()

    # Notify WebSocket clients in real-time
    await manager.broadcast_to_meeting(meeting_id, {"type": "meeting-ended", "message": "Host ended the meeting"})

    return {"message": "Meeting ended successfully"}


@router.post("/{meeting_id}/mute-all")
async def mute_all_participants(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Host control: Mutes all active participants in a meeting."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    if meeting.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the meeting host can mute all participants"
        )

    db.query(Participant).filter(
        Participant.meeting_id == meeting.id,
        Participant.is_active == True
    ).update({"is_muted": True})

    db.commit()

    # Notify WebSocket clients in real-time
    await manager.broadcast_to_meeting(meeting_id, {"type": "mute-all", "muted_by_host": True})

    return {"message": "All participants muted"}


@router.post("/{meeting_id}/participants/{participant_id}/mute")
async def mute_single_participant(
    meeting_id: str,
    participant_id: int,
    is_muted: bool | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Host control: Mutes or unmutes a specific participant in a meeting."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    if meeting.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the meeting host can modify participant mute state"
        )

    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting.id,
        Participant.is_active == True
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found or inactive"
        )

    # Toggle or set explicit mute state
    new_mute_state = is_muted if is_muted is not None else not participant.is_muted
    participant.is_muted = new_mute_state
    db.commit()

    # Notify WebSocket clients in real-time
    await manager.broadcast_to_meeting(
        meeting_id,
        {
            "type": "mute-participant",
            "target_user_id": participant.user_id,
            "participant_id": participant.id,
            "is_muted": new_mute_state
        }
    )

    return {
        "message": f"Participant {participant.display_name} mute state updated to {new_mute_state}",
        "is_muted": new_mute_state
    }


@router.delete("/{meeting_id}/participants/{participant_id}")
async def remove_participant(
    meeting_id: str,
    participant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Host control: Removes/kicks a participant from the meeting."""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    if meeting.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the meeting host can remove participants"
        )

    participant = (
        db.query(Participant)
        .filter(Participant.id == participant_id, Participant.meeting_id == meeting.id)
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found in this meeting"
        )

    participant.is_active = False
    participant.left_at = datetime.utcnow()
    db.commit()

    # Notify WebSocket clients in real-time
    await manager.broadcast_to_meeting(
        meeting_id,
        {
            "type": "participant-removed",
            "participant_id": participant_id,
            "user_id": participant.user_id
        }
    )

    return {"message": "Participant removed successfully"}
