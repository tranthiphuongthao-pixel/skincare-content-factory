from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.database import ContentCalendar, Script, Product, Video
from app.dependencies import get_db, get_current_user

router = APIRouter()


class CalendarCreate(BaseModel):
    script_id: int
    video_id: Optional[int] = None
    scheduled_date: datetime
    time_slot: str = "evening"
    platform: str = "tiktok"
    status: str = "planned"


class CalendarUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    time_slot: Optional[str] = None
    status: Optional[str] = None
    actual_posted_date: Optional[datetime] = None
    video_id: Optional[int] = None


class ScriptBasic(BaseModel):
    id: int
    hook: Optional[str]
    status: str
    topic_type: Optional[str]
    product: Optional[dict]

    class Config:
        from_attributes = True


class CalendarResponse(BaseModel):
    id: int
    user_id: Optional[int]
    script_id: int
    video_id: Optional[int]
    scheduled_date: datetime
    time_slot: Optional[str]
    platform: str
    status: str
    actual_posted_date: Optional[datetime]
    script: Optional[ScriptBasic]

    class Config:
        from_attributes = True


def _entry_to_response(entry: ContentCalendar) -> CalendarResponse:
    script_data = None
    if entry.script:
        product_data = None
        if entry.script.product:
            p = entry.script.product
            brand_name = p.brand_rel.name if p.brand_rel else None
            product_data = {
                "id": p.id,
                "name": p.name,
                "brand_name": brand_name,
            }
        script_data = ScriptBasic(
            id=entry.script.id,
            hook=entry.script.hook,
            status=entry.script.status,
            topic_type=entry.script.topic_type,
            product=product_data,
        )
    return CalendarResponse(
        id=entry.id,
        user_id=entry.user_id,
        script_id=entry.script_id,
        video_id=entry.video_id,
        scheduled_date=entry.scheduled_date,
        time_slot=entry.time_slot,
        platform=entry.platform,
        status=entry.status,
        actual_posted_date=entry.actual_posted_date,
        script=script_data,
    )


@router.get("/", response_model=List[CalendarResponse])
def list_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(ContentCalendar).filter(
        ContentCalendar.user_id == current_user.id
    ).options(
        joinedload(ContentCalendar.script).joinedload(Script.product).joinedload(Product.brand_rel)
    )
    if month and year:
        q = q.filter(
            extract("month", ContentCalendar.scheduled_date) == month,
            extract("year", ContentCalendar.scheduled_date) == year,
        )
    entries = q.order_by(ContentCalendar.scheduled_date).all()
    return [_entry_to_response(e) for e in entries]


@router.post("/", response_model=CalendarResponse)
def create_calendar_entry(
    entry: CalendarCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_entry = ContentCalendar(
        user_id=current_user.id,
        script_id=entry.script_id,
        video_id=entry.video_id,
        scheduled_date=entry.scheduled_date,
        time_slot=entry.time_slot,
        platform=entry.platform,
        status=entry.status,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    e = (
        db.query(ContentCalendar)
        .options(
            joinedload(ContentCalendar.script).joinedload(Script.product).joinedload(Product.brand_rel)
        )
        .filter(ContentCalendar.id == db_entry.id)
        .first()
    )
    return _entry_to_response(e)


@router.put("/{entry_id}", response_model=CalendarResponse)
def update_calendar_entry(
    entry_id: int,
    entry_data: CalendarUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry = db.query(ContentCalendar).filter(
        ContentCalendar.id == entry_id, ContentCalendar.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")
    for k, v in entry_data.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    e = (
        db.query(ContentCalendar)
        .options(
            joinedload(ContentCalendar.script).joinedload(Script.product).joinedload(Product.brand_rel)
        )
        .filter(ContentCalendar.id == entry_id)
        .first()
    )
    return _entry_to_response(e)


@router.delete("/{entry_id}")
def delete_calendar_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry = db.query(ContentCalendar).filter(
        ContentCalendar.id == entry_id, ContentCalendar.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}
