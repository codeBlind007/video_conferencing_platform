from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.participant import Participant


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    meetings: Mapped[list["Meeting"]] = relationship(
        "Meeting",
        back_populates="host",
        cascade="all, delete-orphan"
    )

    participants: Mapped[list["Participant"]] = relationship(
        "Participant",
        back_populates="user",
        cascade="all, delete-orphan"
    )
