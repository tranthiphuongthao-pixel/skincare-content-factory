from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.models.database import Script, Product, Video
from app.dependencies import get_db, get_current_user

router = APIRouter()


class DashboardSummary(BaseModel):
    total_scripts: int
    scripts_this_month: int
    published_videos: int
    product_library_count: int
    streak_days: int


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    total_scripts = db.query(Script).filter(Script.user_id == current_user.id).count()
    scripts_this_month = (
        db.query(Script)
        .filter(Script.user_id == current_user.id, Script.created_at >= month_start)
        .count()
    )
    published_videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id, Video.is_public == True)
        .count()
    )
    product_library_count = (
        db.query(Product)
        .filter(Product.created_by == current_user.id)
        .count()
    )

    script_dates = {
        s.created_at.date()
        for (s,) in db.query(Script.created_at)
        .filter(Script.user_id == current_user.id, Script.created_at != None)
        .order_by(Script.created_at.desc())
        .all()
    }

    streak_days = 0
    if script_dates:
        latest_date = max(script_dates)
        current_day = latest_date
        while current_day in script_dates:
            streak_days += 1
            current_day -= timedelta(days=1)

    return {
        "total_scripts": total_scripts,
        "scripts_this_month": scripts_this_month,
        "published_videos": published_videos,
        "product_library_count": product_library_count,
        "streak_days": streak_days,
    }
