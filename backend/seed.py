"""
Database Seed Script for Zoom Clone Backend
Populates SQLite database with initial sample users, instant/scheduled meetings, and participant records.
Idempotent execution: safe to run multiple times without creating duplicate data.
"""

from datetime import datetime, timedelta
from app.database.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.core.security import hash_password


def seed_data():
    # Ensure clean database tables exist with updated schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()


    try:
        print("🌱 Seeding database...")

        # 1. Create Default Users if they don't exist
        default_users_data = [
            {"name": "Alice Host", "email": "host@example.com", "password": "password123"},
            {"name": "Bob Peer", "email": "user1@example.com", "password": "password123"},
            {"name": "Charlie Peer", "email": "user2@example.com", "password": "password123"}
        ]

        users_dict = {}
        for udata in default_users_data:
            user = db.query(User).filter(User.email == udata["email"]).first()
            if not user:
                user = User(
                    name=udata["name"],
                    email=udata["email"],
                    password_hash=hash_password(udata["password"])
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"  + Created user: {user.email} (ID: {user.id})")
            else:
                print(f"  . User already exists: {user.email} (ID: {user.id})")
            users_dict[udata["email"]] = user

        alice = users_dict["host@example.com"]
        bob = users_dict["user1@example.com"]
        charlie = users_dict["user2@example.com"]

        # 2. Seed Sample Meetings
        meetings_data = [
            {
                "meeting_id": "demo-instant-1",
                "title": "Instant Demo Huddle",
                "description": "Quick instant sync meeting",
                "host_id": alice.id,
                "is_instant": True,
                "is_active": True,
                "scheduled_at": None,
                "duration": None,
                "created_at": datetime.utcnow()
            },
            {
                "meeting_id": "demo-upcom-1",
                "title": "Sprint Planning",
                "description": "Bi-weekly sprint planning session",
                "host_id": alice.id,
                "is_instant": False,
                "is_active": True,
                "scheduled_at": datetime.utcnow() + timedelta(days=1, hours=2),
                "duration": 45,
                "created_at": datetime.utcnow()
            },
            {
                "meeting_id": "demo-upcom-2",
                "title": "Architecture Review",
                "description": "WebRTC SFU & Mesh scaling discussion",
                "host_id": alice.id,
                "is_instant": False,
                "is_active": True,
                "scheduled_at": datetime.utcnow() + timedelta(days=3, hours=5),
                "duration": 60,
                "created_at": datetime.utcnow()
            },
            {
                "meeting_id": "demo-recent-1",
                "title": "Weekly All-Hands",
                "description": "Team catchup and status updates",
                "host_id": alice.id,
                "is_instant": False,
                "is_active": True,
                "scheduled_at": datetime.utcnow() - timedelta(days=2),
                "duration": 30,
                "created_at": datetime.utcnow() - timedelta(days=2)
            },
            {
                "meeting_id": "demo-past-1",
                "title": "Project Kickoff",
                "description": "Initial meeting for Zoom Clone MVP",
                "host_id": alice.id,
                "is_instant": True,
                "is_active": False,
                "scheduled_at": None,
                "duration": 30,
                "created_at": datetime.utcnow() - timedelta(days=5)
            }
        ]

        meetings_dict = {}
        for mdata in meetings_data:
            meeting = db.query(Meeting).filter(Meeting.meeting_id == mdata["meeting_id"]).first()
            if not meeting:
                meeting = Meeting(**mdata)
                db.add(meeting)
                db.commit()
                db.refresh(meeting)
                print(f"  + Created meeting: {meeting.title} [{meeting.meeting_id}]")
            else:
                print(f"  . Meeting already exists: {meeting.title} [{meeting.meeting_id}]")
            meetings_dict[mdata["meeting_id"]] = meeting

        # 3. Seed Participant Records for Recent & Past Meetings
        recent_m = meetings_dict["demo-recent-1"]
        participants_data = [
            {"meeting_id": recent_m.id, "user_id": alice.id, "display_name": "Alice Host", "is_active": True, "is_muted": False},
            {"meeting_id": recent_m.id, "user_id": bob.id, "display_name": "Bob Peer", "is_active": True, "is_muted": True},
            {"meeting_id": recent_m.id, "user_id": charlie.id, "display_name": "Charlie Peer", "is_active": True, "is_muted": False}
        ]

        for pdata in participants_data:
            existing_p = db.query(Participant).filter(
                Participant.meeting_id == pdata["meeting_id"],
                Participant.user_id == pdata["user_id"]
            ).first()
            if not existing_p:
                p = Participant(**pdata)
                db.add(p)
                db.commit()
                print(f"  + Added participant: {pdata['display_name']} to meeting ID {pdata['meeting_id']}")
            else:
                print(f"  . Participant already in meeting: {pdata['display_name']}")

        print("✅ Database seeding completed successfully!\n")

    except Exception as e:
        print(f"❌ Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
