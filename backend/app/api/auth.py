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


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, response: Response, db: Session = Depends(get_db)):
    """Registers a new user, hashes password, saves to DB, sets JWT HTTP-only cookie, and returns token."""
    # 1. Check if user with given email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # 2. Hash the user's password securely
    hashed_pwd = hash_password(user_data.password)

    # 3. Create and save new User record
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Generate JWT access token with user ID in 'sub' claim
    access_token = create_access_token(data={"sub": str(new_user.id)})

    # 5. Set HTTP-only Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )

    return AuthResponse(
        message="User registered successfully",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Authenticates user with email and password, sets JWT HTTP-only cookie."""
    # 1. Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # 2. Verify user existence and password hash
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 3. Generate JWT access token with user ID in 'sub' claim
    access_token = create_access_token(data={"sub": str(user.id)})

    # 4. Set HTTP-only Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )

    return AuthResponse(
        message="Logged in successfully",
        user=UserResponse.model_validate(user)
    )




@router.post("/logout")
def logout(response: Response):
    """
    Clears the HTTP-only JWT access token cookie on logout.
    """
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False
    )
    return {
        "message": "Logged out successfully"
    }
