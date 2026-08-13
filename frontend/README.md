# Zoom Clone Frontend (Next.js + WebRTC)

A modern, responsive Zoom Clone frontend built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Browser WebRTC APIs**, and **Native WebSocket API**. Fully integrated with the FastAPI backend.

---

## 🛠️ Tech Stack & Features

- ⚡ **Next.js 14 App Router**: Server & Client Component boundaries for optimum rendering.
- 🎨 **Tailwind CSS & Lucide Icons**: Professional Zoom dark theme (`#1A1D24`, `#24272C`, `#0E71EB`).
- 🔐 **JWT Auth Context**: Automatic HTTP-only cookie handling & persistent profile state.
- 📹 **Pre-Join Preview Screen**: Camera preview (`getUserMedia`), microphone toggle, device permission error handling.
- 🌐 **Real WebRTC P2P Mesh Room**: WebSocket signaling server connection, SDP offer/answer exchange, ICE candidate relay, responsive video grid, participant labels, camera-off avatar fallbacks.
- 👑 **Host Controls**: Real-time Mute All, Kick Participant, and End Meeting room broadcast handling.

---

## 🚀 Setup & Execution Guide

### 1. Install Dependencies
In the `frontend` directory, run:
```bash
npm install
```

### 2. Environment Variables
Verify `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Complete End-to-End Testing Flow

1. **Start Backend & Seed Data**:
   ```bash
   cd backend
   python seed.py
   uvicorn app.main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Sign In**:
   - Navigate to `http://localhost:3000/login`
   - Log in as **Alice (Host)**: `host@example.com` / `password123`

4. **Start Instant Meeting**:
   - On the Zoom Dashboard, click **New Meeting**.
   - You will be redirected directly into the meeting room (`/meeting/[meetingId]`).

5. **Join from Second Browser / Incognito Window**:
   - Copy the Meeting ID or invite URL from the top bar or bottom control bar.
   - Open a second browser window (e.g., Chrome Incognito or Firefox).
   - Log in as **Bob (Peer)**: `user1@example.com` / `password123`.
   - Click **Join Meeting**, paste the Meeting ID, and click Join.
   - On the `/join/[meetingId]` preview screen, check camera preview and click **Join Meeting Now**.

6. **WebRTC Video Conferencing & Signaling**:
   - Both browser windows connect to `ws://localhost:8000/api/ws/meetings/[meetingId]`.
   - WebRTC SDP offers/answers and ICE candidates exchange automatically.
   - Both local and remote video streams render in real time in the responsive grid.

7. **Test Controls & Host Privileges**:
   - Test Mute Mic & Stop Video controls in both windows.
   - Open the **Participants Panel** in Alice's (Host) window and click **Mute All**. Verify Bob's mic is muted.
   - Click **End Meeting** in Alice's window. Verify both clients leave the room cleanly.
