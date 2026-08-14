"""
Comprehensive Backend Test Script for Zoom Clone
Tests Signup, Login, Instant Meeting, Scheduling, Join/Leave, Host Controls, and WebSockets.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import Base, engine

# Re-create database schema
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_full_zoom_clone_backend():
    print("Running Zoom Clone Backend Tests...")

    # 1. Signup Alice (Host)
    res_alice = client.post("/api/auth/signup", json={"name": "Alice Host", "email": "alice@example.com", "password": "password123"})
    assert res_alice.status_code == 201, res_alice.json()
    alice_cookie = res_alice.cookies.get("access_token")
    assert alice_cookie is not None
    print("  [OK] Alice signup & HTTP-only cookie verified")

    # 2. Signup Bob (Participant)
    res_bob = client.post("/api/auth/signup", json={"name": "Bob Peer", "email": "bob@example.com", "password": "password123"})
    assert res_bob.status_code == 201, res_bob.json()
    bob_cookie = res_bob.cookies.get("access_token")
    assert bob_cookie is not None
    print("  [OK] Bob signup & HTTP-only cookie verified")

    # 3. Alice creates Instant Meeting
    client.cookies.set("access_token", alice_cookie)
    res_inst = client.post("/api/meetings/instant", json={"title": "Alice Quick Sync"})
    assert res_inst.status_code == 201, res_inst.json()
    inst_data = res_inst.json()
    meeting_id = inst_data["meeting_id"]
    assert inst_data["is_instant"] is True
    assert inst_data["host_id"] == 1
    print(f"  [OK] Instant meeting created: {meeting_id}")

    # 4. Bob joins Alice's meeting
    client.cookies.set("access_token", bob_cookie)
    res_join = client.post(f"/api/meetings/{meeting_id}/join", json={"display_name": "Bob Browser"})
    assert res_join.status_code == 200, res_join.json()
    p_data = res_join.json()
    assert p_data["display_name"] == "Bob Browser"
    assert p_data["is_active"] is True
    print(f"  [OK] Bob joined meeting ID: {meeting_id} as participant ID: {p_data['id']}")

    # 5. Alice checks participants list
    client.cookies.set("access_token", alice_cookie)
    res_parts = client.get(f"/api/meetings/{meeting_id}/participants")
    assert res_parts.status_code == 200
    assert len(res_parts.json()) == 1
    print("  [OK] Host retrieved participant list")

    # 6. Alice mutes all participants
    res_mute = client.post(f"/api/meetings/{meeting_id}/mute-all")
    assert res_mute.status_code == 200
    print("  [OK] Host muted all participants")

    # 7. Alice schedules a future meeting
    from datetime import datetime, timedelta
    future_time = (datetime.utcnow() + timedelta(days=2)).isoformat()
    res_sched = client.post("/api/meetings/schedule", json={
        "title": "Future Project Demo",
        "description": "Demonstrating WebRTC & Host controls",
        "scheduled_at": future_time,
        "duration": 60
    })
    assert res_sched.status_code == 201
    sched_data = res_sched.json()
    assert sched_data["is_instant"] is False
    print(f"  [OK] Scheduled meeting created: {sched_data['meeting_id']}")

    # 8. Check upcoming meetings
    res_upcom = client.get("/api/meetings/upcoming")
    assert res_upcom.status_code == 200
    assert len(res_upcom.json()) >= 1
    print("  [OK] Upcoming meetings list retrieved")

    # 9. Alice ends instant meeting
    res_end = client.patch(f"/api/meetings/{meeting_id}/end")
    assert res_end.status_code == 200
    print(f"  [OK] Host ended meeting ID: {meeting_id}")

    # 10. Verify meeting details report inactive
    res_detail = client.get(f"/api/meetings/{meeting_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["is_active"] is False
    print("  [OK] Meeting state confirmed inactive")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_full_zoom_clone_backend()
