from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.meeting import Meeting


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    meeting_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meetings.id"),
        index=True,
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        index=True,
        nullable=False
    )

    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    is_muted: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    is_video_off: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    left_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="participants")
    user: Mapped["User"] = relationship("User", back_populates="participants")
