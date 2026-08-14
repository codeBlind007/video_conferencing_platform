from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import UserSignup, UserLogin, AuthResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


def set_auth_cookie(response: Response, access_token: str):
    cookie_kwargs = {
        "key": "access_token",
        "value": access_token,
        "httponly": True,
        "max_age": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "samesite": settings.COOKIE_SAMESITE,
        "secure": settings.COOKIE_SECURE,
    }
    if settings.COOKIE_DOMAIN:
        cookie_kwargs["domain"] = settings.COOKIE_DOMAIN

    response.set_cookie(**cookie_kwargs)


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, response: Response, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    hashed_pwd = hash_password(user_data.password)

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id)})
    set_auth_cookie(response, access_token)

    return AuthResponse(
        message="User registered successfully",
        user=UserResponse.model_validate(new_user),
        access_token=access_token
    )


@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    set_auth_cookie(response, access_token)

    return AuthResponse(
        message="Logged in successfully",
        user=UserResponse.model_validate(user),
        access_token=access_token
    )


@router.post("/logout")
def logout(response: Response):
    cookie_kwargs = {
        "key": "access_token",
        "httponly": True,
        "samesite": settings.COOKIE_SAMESITE,
        "secure": settings.COOKIE_SECURE,
    }
    if settings.COOKIE_DOMAIN:
        cookie_kwargs["domain"] = settings.COOKIE_DOMAIN

    response.delete_cookie(**cookie_kwargs)
    return {
        "message": "Logged out successfully"
    }
