from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
load_dotenv()
import os
from app.database.database import Base, engine, get_db
from app.models import User, Meeting, Participant
from app.api.auth import router as auth_router
from app.api.meetings import router as meetings_router
from app.api.ws import router as ws_router

from sqlalchemy import inspect

CLIENT_URL = os.getenv("FRONTEND_URL")

def ensure_database_schema():
    try:
        inspector = inspect(engine)
        if "meetings" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("meetings")]
            if "host_id" not in columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE meetings ADD COLUMN host_id INTEGER DEFAULT 1 REFERENCES users(id)"))
                    conn.commit()
    except Exception as e:
        print("Schema check notice:", e)

ensure_database_schema()
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Zoom Clone API",
    description="Backend API for Zoom Clone featuring JWT Authentication, Meeting Management & WebRTC Signaling"
)

allowed_origins_env = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
]
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
if CLIENT_URL:
    origins.append(CLIENT_URL)
for o in allowed_origins_env:
    if o not in origins:
        origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(meetings_router)
app.include_router(ws_router)


@app.get("/")
def health_check():
    return {
        "message": "Zoom Clone API is running"
    }


@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "message": "Database connected successfully"
    }