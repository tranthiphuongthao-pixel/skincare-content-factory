from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.database import Analytics, Script, Product, Video, User
from app.dependencies import get_db, get_current_user

router = APIRouter()


class AnalyticsCreate(BaseModel):
    script_id: int
    video_id: Optional[int] = None
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    follower_gain: int = 0


class AnalyticsResponse(BaseModel):
    id: int
    user_id: Optional[int]
    script_id: int
    video_id: Optional[int]
    views: int
    likes: int
    comments: int
    shares: int
    saves: int
    follower_gain: int
    recorded_at: datetime

    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    total_views: int
    total_likes: int
    total_comments: int
    total_shares: int
    total_saves: int
    total_follower_gain: int
    total_videos: int
    avg_engagement_rate: float


@router.get("/", response_model=List[AnalyticsResponse])
def list_analytics(
    script_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Analytics).filter(Analytics.user_id == current_user.id)
    if script_id:
        q = q.filter(Analytics.script_id == script_id)
    return q.order_by(Analytics.recorded_at.desc()).all()


@router.post("/", response_model=AnalyticsResponse)
def create_analytics(
    data: AnalyticsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_analytics = Analytics(
        user_id=current_user.id,
        script_id=data.script_id,
        video_id=data.video_id,
        views=data.views,
        likes=data.likes,
        comments=data.comments,
        shares=data.shares,
        saves=data.saves,
        follower_gain=data.follower_gain,
    )
    db.add(db_analytics)
    db.commit()
    db.refresh(db_analytics)
    return db_analytics


@router.get("/summary", response_model=AnalyticsSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    all_analytics = db.query(Analytics).filter(Analytics.user_id == current_user.id).all()
    total_views = sum(a.views for a in all_analytics)
    total_likes = sum(a.likes for a in all_analytics)
    total_comments = sum(a.comments for a in all_analytics)
    total_shares = sum(a.shares for a in all_analytics)
    total_saves = sum(a.saves for a in all_analytics)
    total_follower_gain = sum(a.follower_gain for a in all_analytics)
    engagement = (
        (total_likes + total_comments + total_shares + total_saves)
        / max(total_views, 1)
        * 100
    )
    return {
        "total_views": total_views,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_shares": total_shares,
        "total_saves": total_saves,
        "total_follower_gain": total_follower_gain,
        "total_videos": len(all_analytics),
        "avg_engagement_rate": round(engagement, 2),
    }


@router.get("/top-performing")
def get_top_performing(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analytics = (
        db.query(Analytics)
        .filter(Analytics.user_id == current_user.id)
        .options(
            joinedload(Analytics.script).joinedload(Script.product)
        )
        .all()
    )
    sorted_analytics = sorted(
        analytics,
        key=lambda a: a.views + a.likes * 3 + a.saves * 5,
        reverse=True,
    )
    return sorted_analytics[:limit]
