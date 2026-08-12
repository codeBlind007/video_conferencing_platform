from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import Base, engine, get_db
from app.models import User, Meeting
from app.api.auth import router as auth_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Zoom Clone API",
    description="Backend API for Zoom Clone featuring JWT Authentication & Cookie handling"
)

# Register Authentication routes
app.include_router(auth_router)


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