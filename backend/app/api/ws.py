import asyncio
import jwt
from typing import Dict, List, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import SessionLocal
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant

router = APIRouter(
    prefix="/api/ws",
    tags=["WebRTC Signaling"]
)


class ConnectionManager:
    """
    In-memory WebSocket Connection Manager grouped by meeting_id.
    Relays WebRTC P2P signaling messages (offer, answer, ICE candidates)
    and broadcasts meeting state updates (join, leave, mute, end).
    """

    def __init__(self):
        # meeting_id -> list of connection dicts
        # Dict structure: {"websocket": WebSocket, "user_id": int, "participant_id": int, "display_name": str}
        self.active_connections: Dict[str, List[Dict[str, Any]]] = {}

    async def connect(self, meeting_id: str, websocket: WebSocket, user_id: int, participant_id: int, display_name: str):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        
        # Remove any existing connection for this user in the same meeting to prevent duplicate sockets
        self.active_connections[meeting_id] = [
            conn for conn in self.active_connections[meeting_id]
            if conn["user_id"] != user_id
        ]

        connection_info = {
            "websocket": websocket,
            "user_id": user_id,
            "participant_id": participant_id,
            "display_name": display_name
        }
        self.active_connections[meeting_id].append(connection_info)

    def disconnect(self, meeting_id: str, websocket: WebSocket) -> Dict[str, Any] | None:
        disconnected_user = None
        if meeting_id in self.active_connections:
            for conn in self.active_connections[meeting_id]:
                if conn["websocket"] == websocket:
                    disconnected_user = conn
                    break
            self.active_connections[meeting_id] = [
                conn for conn in self.active_connections[meeting_id]
                if conn["websocket"] != websocket
            ]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]
        return disconnected_user

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    async def send_to_user(self, meeting_id: str, target_user_id: int, message: dict):
        if meeting_id in self.active_connections:
            for conn in self.active_connections[meeting_id]:
                if conn["user_id"] == target_user_id:
                    try:
                        await conn["websocket"].send_json(message)
                    except Exception:
                        pass

    async def broadcast_to_meeting(self, meeting_id: str, message: dict, exclude: WebSocket | None = None):
        if meeting_id in self.active_connections:
            for conn in self.active_connections[meeting_id]:
                if conn["websocket"] != exclude:
                    try:
                        await conn["websocket"].send_json(message)
                    except Exception:
                        pass

    def get_room_participants(self, meeting_id: str) -> List[Dict[str, Any]]:
        if meeting_id not in self.active_connections:
            return []
        return [
            {
                "user_id": conn["user_id"],
                "participant_id": conn["participant_id"],
                "display_name": conn["display_name"]
            }
            for conn in self.active_connections[meeting_id]
        ]


manager = ConnectionManager()


def authenticate_websocket(websocket: WebSocket) -> int | None:
    """
    Authenticates WebSocket connection via 'token' query parameter or 'access_token' cookie.
    Returns user_id if valid, None otherwise.
    """
    token = websocket.query_params.get("token")
    if not token and websocket.cookies:
        token = websocket.cookies.get("access_token")

    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        return int(user_id_str) if user_id_str else None
    except Exception:
        return None


@router.websocket("/meetings/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    user_id = authenticate_websocket(websocket)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        return

    db: Session = SessionLocal()
    try:
        # Validate meeting existence and active status
        meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id, Meeting.is_active == True).first()
        if not meeting:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Meeting not found or inactive")
            return

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
            return

        # Find or create active participant record
        participant = db.query(Participant).filter(
            Participant.meeting_id == meeting.id,
            Participant.user_id == user.id,
            Participant.is_active == True
        ).first()

        display_name = participant.display_name if participant else user.name
        participant_id = participant.id if participant else 0

        # Connect WebSocket
        await manager.connect(meeting_id, websocket, user_id, participant_id, display_name)

        # Notify others in the meeting about participant join
        await manager.broadcast_to_meeting(
            meeting_id,
            {
                "type": "participant-joined",
                "user_id": user_id,
                "participant_id": participant_id,
                "display_name": display_name,
                "active_participants": manager.get_room_participants(meeting_id)
            },
            exclude=websocket
        )

        # Send existing participant list to the joined user
        await manager.send_personal_message(
            {
                "type": "room-state",
                "user_id": user_id,
                "participant_id": participant_id,
                "display_name": display_name,
                "active_participants": manager.get_room_participants(meeting_id)
            },
            websocket
        )

        # Message Listening Loop
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type in ["offer", "answer", "ice-candidate"]:
                # Relay P2P WebRTC signaling message to target participant or broadcast
                target_id = data.get("target_user_id")
                payload = {
                    "type": msg_type,
                    "sender_user_id": user_id,
                    "display_name": display_name,
                    "data": data.get("data")
                }
                if target_id:
                    await manager.send_to_user(meeting_id, int(target_id), payload)
                else:
                    await manager.broadcast_to_meeting(meeting_id, payload, exclude=websocket)

            elif msg_type == "participant-muted":
                await manager.broadcast_to_meeting(
                    meeting_id,
                    {
                        "type": "participant-muted",
                        "user_id": user_id,
                        "is_muted": data.get("is_muted", True)
                    }
                )

            elif msg_type == "mute-participant":
                target_user_id = data.get("target_user_id")
                is_muted_val = data.get("is_muted", True)
                await manager.broadcast_to_meeting(
                    meeting_id,
                    {
                        "type": "mute-participant",
                        "target_user_id": target_user_id,
                        "participant_id": data.get("participant_id"),
                        "is_muted": is_muted_val
                    }
                )

            elif msg_type == "chat":
                await manager.broadcast_to_meeting(
                    meeting_id,
                    {
                        "type": "chat",
                        "user_id": user_id,
                        "sender": data.get("sender", display_name),
                        "text": data.get("text"),
                        "timestamp": data.get("timestamp")
                    },
                    exclude=websocket
                )

            elif msg_type == "leave":
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error in meeting {meeting_id}: {e}")
    finally:
        disconnected_info = manager.disconnect(meeting_id, websocket)
        if disconnected_info:
            await manager.broadcast_to_meeting(
                meeting_id,
                {
                    "type": "participant-left",
                    "user_id": disconnected_info["user_id"],
                    "display_name": disconnected_info["display_name"],
                    "active_participants": manager.get_room_participants(meeting_id)
                }
            )
        db.close()
