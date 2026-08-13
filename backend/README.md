# Zoom Clone Backend & WebRTC Signaling Server

A production-ready **FastAPI + SQLAlchemy + SQLite + JWT** backend for a Zoom Clone application, featuring comprehensive meeting management, host controls, participant state tracking, and a **real-time WebRTC WebSocket signaling server**.

---

## 📋 Features

- 🔐 **JWT Authentication**: User registration, login, logout, and HTTP-only cookie security.
- ⚡ **Instant Meetings**: Create URL-safe, unique meeting IDs (`abc-def-ghi`) and shareable invite links instantly.
- 📅 **Scheduled Meetings**: Schedule future meetings with custom titles, descriptions, and durations; view upcoming and recent meeting history.
- 🚪 **Meeting Join & Participant Tracking**: Join/leave meetings with custom display names, prevent duplicate active joins, track mute state and timestamps (`joined_at`, `left_at`).
- 👑 **Host Controls**: Host-only privileges to end meetings, mute all participants, and kick individual participants in real time.
- 📡 **WebRTC WebSocket Signaling Server**: Relays SDP offers, answers, ICE candidates, and room state broadcasts (`join`, `leave`, `mute`, `end`, `kick`) between peers.
- 🌱 **Idempotent Data Seeder**: Built-in script to populate SQLite with sample users and past/upcoming meetings.

---

## 📁 Repository Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── auth.py          # Signup, Login, Logout routes
│   │   ├── meetings.py      # Instant, Schedule, Join, Leave & Host Control routes
│   │   └── ws.py            # WebRTC WebSocket Signaling Server & ConnectionManager
│   ├── core/
│   │   ├── config.py        # Environment settings
│   │   └── security.py      # Password hashing & JWT get_current_user dependency
│   ├── database/
│   │   └── database.py      # SQLAlchemy engine & session setup
│   ├── models/
│   │   ├── user.py          # User SQLAlchemy model
│   │   ├── meeting.py       # Meeting SQLAlchemy model
│   │   └── participant.py   # Participant SQLAlchemy model
│   └── schemas/
│       ├── auth.py          # Auth Pydantic schemas
│       ├── meeting.py       # Meeting Pydantic schemas
│       └── participant.py   # Participant Pydantic schemas
├── main.py                  # FastAPI application entry point & router registration
├── seed.py                  # Database seeder script
├── zoom_clone.db            # SQLite database file
├── requirements.txt         # Dependencies
└── README.md                # Documentation
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Python 3.10+
- Virtual environment (recommended)

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Seed the Database
Populate the SQLite database with default sample users and meetings:
```bash
python seed.py
```

Default credentials created by `seed.py`:
- **Alice (Host)**: `host@example.com` / `password123`
- **Bob (Peer)**: `user1@example.com` / `password123`
- **Charlie (Peer)**: `user2@example.com` / `password123`

### 5. Run the Server
```bash
uvicorn app.main:app --reload
```
The API server will run at `http://localhost:8000`. Interactive OpenAPI documentation will be available at `http://localhost:8000/docs`.

---

## 🔌 API Reference Overview

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new user & set HTTP-only cookie | ❌ No |
| `POST` | `/api/auth/login` | Authenticate user & set HTTP-only cookie | ❌ No |
| `POST` | `/api/auth/logout` | Clear HTTP-only cookie | ❌ No |

### 📹 Meetings (`/api/meetings`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/meetings/instant` | Create instant meeting (`abc-def-ghi`) | 🔒 Yes |
| `POST` | `/api/meetings/schedule` | Schedule future meeting | 🔒 Yes |
| `GET` | `/api/meetings/upcoming` | List upcoming scheduled meetings | 🔒 Yes |
| `GET` | `/api/meetings/recent` | List recent meetings hosted or joined | 🔒 Yes |
| `GET` | `/api/meetings/{meeting_id}` | Fetch meeting & active participant details | 🔒 Yes |
| `POST` | `/api/meetings/{meeting_id}/join` | Join meeting with custom display name | 🔒 Yes |
| `POST` | `/api/meetings/{meeting_id}/leave` | Leave active meeting | 🔒 Yes |

### 👑 Host Controls (`/api/meetings/{meeting_id}/...`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meetings/{meeting_id}/participants` | List active participants | 🔒 Yes |
| `PATCH` | `/api/meetings/{meeting_id}/end` | End meeting for all participants (Host only) | 🔒 Host |
| `POST` | `/api/meetings/{meeting_id}/mute-all` | Mute all participants (Host only) | 🔒 Host |
| `DELETE` | `/api/meetings/{meeting_id}/participants/{id}` | Kick participant from meeting (Host only) | 🔒 Host |

---

## 🌐 WebRTC Video Conferencing Signaling

### Overview
The backend acts as a **WebRTC Signaling Server** using WebSockets. It does **not** process, transcode, or stream raw video/audio media tracks. Media streaming takes place directly between browser peers via browser `RTCPeerConnection` APIs.

```text
Next.js Browser A                              Next.js Browser B
   │                                               │
   │ 1. getUserMedia()                             │ 1. getUserMedia()
   │ 2. RTCPeerConnection                          │ 2. RTCPeerConnection
   │                                               │
   │──── WS: offer / answer / ICE Candidates ─────►│ (Relayed by FastAPI WS Server)
   │                                               │
   ◄───────────────── WebRTC Media Stream ────────► (Direct Peer-to-Peer Audio/Video)
```

### WebSocket Endpoint
```text
WS /api/ws/meetings/{meeting_id}?token=<JWT_TOKEN>
```
*(Also supports authentication via the `access_token` HTTP-only cookie automatically sent by browsers).*

### Supported JSON Signaling Protocol

#### 1. Participant Join (`participant-joined`)
Broadcasted when a new user connects to the meeting room:
```json
{
  "type": "participant-joined",
  "user_id": 2,
  "participant_id": 5,
  "display_name": "Bob Peer",
  "active_participants": [ ... ]
}
```

#### 2. WebRTC SDP Offer (`offer`)
Relayed from caller to target peer:
```json
{
  "type": "offer",
  "target_user_id": 2,
  "data": { "type": "offer", "sdp": "v=0..." }
}
```

#### 3. WebRTC SDP Answer (`answer`)
Relayed from answerer to caller:
```json
{
  "type": "answer",
  "target_user_id": 1,
  "data": { "type": "answer", "sdp": "v=0..." }
}
```

#### 4. ICE Candidates (`ice-candidate`)
Relayed between peers:
```json
{
  "type": "ice-candidate",
  "target_user_id": 2,
  "data": { "candidate": "candidate:1 1 UDP...", "sdpMid": "0", "sdpMLineIndex": 0 }
}
```

#### 5. Mute Controls (`participant-muted` / `mute-all`)
Broadcast when a participant or host changes audio mute status:
```json
{
  "type": "participant-muted",
  "user_id": 2,
  "is_muted": true
}
```

#### 6. Host Meeting Termination (`meeting-ended`)
Broadcast when host ends the meeting:
```json
{
  "type": "meeting-ended",
  "message": "Host ended the meeting"
}
```

---

## 🏗️ Architecture & Production Assumptions

### P2P Mesh Architecture (Current Implementation)
- In this initial implementation, frontend clients establish an **$N$-way Peer-to-Peer (P2P) Full Mesh** network topology. Each participant creates direct `RTCPeerConnection` instances with every other peer in the room.
- **Ideal for**: Small-group meetings (2 to 5 participants).
- **Network Bandwidth**: Upload bandwidth scales linearly ($O(N)$) per client, as each peer must encode and send their media stream to every other participant.

### Scaling to Production (Selective Forwarding Unit - SFU)
- For larger Zoom-style meetings (10 to 100+ participants), an **SFU (Selective Forwarding Unit)** server such as **LiveKit**, **Mediasoup**, or **Janus** must be integrated.
- With an SFU, each client sends their media stream **once** to the central SFU server, which then routes and forwards incoming streams to all other peers, drastically reducing client bandwidth and CPU overhead.
- In production, STUN/TURN servers (e.g. **Coturn**) should also be configured to handle NAT traversal across strict firewalls and corporate networks.

---

## 🧪 Testing Guide

### 1. Testing REST Endpoints via Swagger UI (`/docs`)
1. Open [http://localhost:8000/docs](http://localhost:8000/docs).
2. Execute `POST /api/auth/login` using `host@example.com` / `password123`.
3. The server sets an `HTTP-only` cookie (`access_token`), so subsequent requests in the browser automatically authorize. You can also copy the JWT token if using API tools.
4. Try creating instant meetings (`POST /api/meetings/instant`), scheduling meetings (`POST /api/meetings/schedule`), or testing host control endpoints (`PATCH /api/meetings/{meeting_id}/end`).

### 2. Testing WebSockets via Browser Console
Open two browser tabs or windows on `http://localhost:8000/docs`, log in, open Developer Tools (F12) -> Console, and run:

```javascript
// Connect to WebSocket signaling for meeting "demo-instant-1"
const ws = new WebSocket("ws://localhost:8000/api/ws/meetings/demo-instant-1");

ws.onopen = () => console.log("Connected to WebRTC Signaling Server!");
ws.onmessage = (event) => console.log("Signaling Message Received:", JSON.parse(event.data));
ws.onclose = () => console.log("WebSocket Disconnected");

// Send a test ICE candidate or custom signal message
ws.send(JSON.stringify({
    type: "ice-candidate",
    target_user_id: 1,
    data: { candidate: "sample-candidate" }
}));
```
