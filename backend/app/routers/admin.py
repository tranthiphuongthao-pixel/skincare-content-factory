from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.models.database import User, Video, Product, Script, AuditLog
from app.dependencies import get_db, require_admin

router = APIRouter()


class AdminStatsResponse(BaseModel):
    total_users: int
    total_videos: int
    total_products: int
    total_public_videos: int
    new_users_this_week: int
    new_videos_this_week: int
    videos_with_warnings: int
    pending_review_count: int


class AdminUserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str]
    role: str
    subscription_plan: str
    is_active: bool
    created_at: datetime
    video_count: int
    script_count: int

    class Config:
        from_attributes = True


class AdminUsersListResponse(BaseModel):
    items: List[AdminUserResponse]
    total: int
    page: int
    pages: int


class AdminVideoResponse(BaseModel):
    id: int
    title: Optional[str]
    platform: str
    status: str
    is_public: bool
    tiktok_policy_status: str
    policy_issues: Optional[List]
    view_count: int
    created_at: datetime
    user_id: int
    user_email: Optional[str] = None
    user_username: Optional[str] = None
    product_id: Optional[int]
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class AdminVideosListResponse(BaseModel):
    items: List[AdminVideoResponse]
    total: int
    page: int
    pages: int


class ContentReportItem(BaseModel):
    video_id: int
    title: Optional[str]
    user_id: int
    user_email: Optional[str]
    user_username: Optional[str]
    tiktok_policy_status: str
    policy_issues: Optional[List]
    created_at: datetime


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    total_users = db.query(User).count()
    total_videos = db.query(Video).count()
    total_products = db.query(Product).count()
    total_public_videos = db.query(Video).filter(Video.is_public == True).count()
    new_users_this_week = db.query(User).filter(User.created_at >= week_ago).count()
    new_videos_this_week = db.query(Video).filter(Video.created_at >= week_ago).count()
    videos_with_warnings = (
        db.query(Video)
        .filter(Video.tiktok_policy_status.in_(["warning", "danger"]))
        .count()
    )
    pending_review_count = (
        db.query(Video)
        .filter(Video.tiktok_policy_status == "unchecked", Video.is_public == True)
        .count()
    )

    return AdminStatsResponse(
        total_users=total_users,
        total_videos=total_videos,
        total_products=total_products,
        total_public_videos=total_public_videos,
        new_users_this_week=new_users_this_week,
        new_videos_this_week=new_videos_this_week,
        videos_with_warnings=videos_with_warnings,
        pending_review_count=pending_review_count,
    )


@router.get("/users", response_model=AdminUsersListResponse)
def list_admin_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = db.query(User)
    if search:
        q = q.filter(
            (User.email.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%"))
        )
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit

    items = []
    for user in users:
        video_count = db.query(Video).filter(Video.user_id == user.id).count()
        script_count = db.query(Script).filter(Script.user_id == user.id).count()
        items.append(
            AdminUserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                role=user.role,
                subscription_plan=user.subscription_plan,
                is_active=user.is_active,
                created_at=user.created_at,
                video_count=video_count,
                script_count=script_count,
            )
        )

    return AdminUsersListResponse(items=items, total=total, page=page, pages=pages)


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot toggle your own account")

    user.is_active = not user.is_active
    db.commit()

    ip_address = request.client.host if request.client else None
    log = AuditLog(
        user_id=current_user.id,
        action="admin_toggle_user",
        target_type="user",
        target_id=user_id,
        ip_address=ip_address,
        metadata={"new_is_active": user.is_active, "target_email": user.email},
    )
    db.add(log)
    db.commit()

    return {"user_id": user_id, "is_active": user.is_active}


@router.get("/videos", response_model=AdminVideosListResponse)
def list_admin_videos(
    page: int = 1,
    limit: int = 20,
    is_public: Optional[bool] = None,
    policy_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = db.query(Video)
    if is_public is not None:
        q = q.filter(Video.is_public == is_public)
    if policy_status:
        q = q.filter(Video.tiktok_policy_status == policy_status)

    total = q.count()
    videos = q.order_by(Video.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit

    items = []
    for video in videos:
        user_email = None
        user_username = None
        if video.user:
            user_email = video.user.email
            user_username = video.user.username
        product_name = None
        if video.product:
            product_name = video.product.name

        items.append(
            AdminVideoResponse(
                id=video.id,
                title=video.title,
                platform=video.platform,
                status=video.status,
                is_public=video.is_public,
                tiktok_policy_status=video.tiktok_policy_status,
                policy_issues=video.policy_issues or [],
                view_count=video.view_count,
                created_at=video.created_at,
                user_id=video.user_id,
                user_email=user_email,
                user_username=user_username,
                product_id=video.product_id,
                product_name=product_name,
            )
        )

    return AdminVideosListResponse(items=items, total=total, page=page, pages=pages)


@router.put("/videos/{video_id}/toggle-public")
def toggle_video_public(
    video_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.is_public = not video.is_public
    video.updated_at = datetime.utcnow()
    db.commit()

    ip_address = request.client.host if request.client else None
    log = AuditLog(
        user_id=current_user.id,
        action="admin_toggle_video",
        target_type="video",
        target_id=video_id,
        ip_address=ip_address,
        metadata={"new_is_public": video.is_public, "video_user_id": video.user_id},
    )
    db.add(log)
    db.commit()

    return {"video_id": video_id, "is_public": video.is_public}


@router.get("/content-report")
def get_content_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    videos = (
        db.query(Video)
        .filter(Video.tiktok_policy_status.in_(["warning", "danger"]))
        .order_by(Video.created_at.desc())
        .all()
    )

    result = []
    for video in videos:
        user_email = None
        user_username = None
        if video.user:
            user_email = video.user.email
            user_username = video.user.username

        result.append(
            ContentReportItem(
                video_id=video.id,
                title=video.title,
                user_id=video.user_id,
                user_email=user_email,
                user_username=user_username,
                tiktok_policy_status=video.tiktok_policy_status,
                policy_issues=video.policy_issues or [],
                created_at=video.created_at,
            )
        )

    return {"total": len(result), "items": result}
