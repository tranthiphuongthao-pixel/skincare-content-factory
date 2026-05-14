from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional
from app.models.database import User
from app.dependencies import get_db, get_current_user
from app.config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserCreate(BaseModel):
    email: str
    username: str
    password: str


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    tiktok_handle: Optional[str] = None
    skin_type: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str]
    role: str
    avatar_url: Optional[str]
    bio: Optional[str]
    tiktok_handle: Optional[str]
    skin_type: Optional[str]
    subscription_plan: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=pwd_context.hash(user_data.password),
        role="user",
        subscription_plan="free",
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = create_access_token({"sub": str(db_user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user,
    }


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    access_token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for k, v in user_data.model_dump(exclude_unset=True).items():
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user
