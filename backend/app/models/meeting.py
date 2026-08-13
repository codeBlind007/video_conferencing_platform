from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.participant import Participant


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    meeting_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    host_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    duration: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    is_instant: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    # Relationships
    host: Mapped["User"] = relationship("User", back_populates="meetings")
    participants: Mapped[list["Participant"]] = relationship(
        "Participant",
        back_populates="meeting",
        cascade="all, delete-orphan"
    )
