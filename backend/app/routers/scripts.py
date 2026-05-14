from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.database import Script, Product, Brand
from app.dependencies import get_db, get_current_user

router = APIRouter()


class ScriptCreate(BaseModel):
    product_id: int
    hook: Optional[str] = None
    scenes: Optional[list] = None
    caption: Optional[str] = None
    hashtags: Optional[list] = None
    voiceover_text: Optional[str] = None
    music_vibe: Optional[str] = None
    topic_type: Optional[str] = None
    format_type: Optional[str] = None
    estimated_performance: Optional[str] = None
    ai_generated: bool = False
    status: str = "draft"
    scheduled_date: Optional[datetime] = None


class ScriptUpdate(BaseModel):
    hook: Optional[str] = None
    scenes: Optional[list] = None
    caption: Optional[str] = None
    hashtags: Optional[list] = None
    voiceover_text: Optional[str] = None
    music_vibe: Optional[str] = None
    status: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    posted_date: Optional[datetime] = None
    performance_notes: Optional[str] = None


class ProductBasic(BaseModel):
    id: int
    name: str
    image_url: Optional[str]
    brand_name: Optional[str] = None

    class Config:
        from_attributes = True


class ScriptResponse(BaseModel):
    id: int
    user_id: Optional[int]
    product_id: int
    hook: Optional[str]
    scenes: Optional[list]
    caption: Optional[str]
    hashtags: Optional[list]
    voiceover_text: Optional[str]
    music_vibe: Optional[str]
    topic_type: Optional[str]
    format_type: Optional[str]
    estimated_performance: Optional[str]
    ai_generated: bool
    status: str
    scheduled_date: Optional[datetime]
    posted_date: Optional[datetime]
    performance_notes: Optional[str]
    created_at: datetime
    product: Optional[ProductBasic]

    class Config:
        from_attributes = True


def _script_to_response(script: Script) -> ScriptResponse:
    product_data = None
    if script.product:
        brand_name = None
        if script.product.brand_rel:
            brand_name = script.product.brand_rel.name
        product_data = ProductBasic(
            id=script.product.id,
            name=script.product.name,
            image_url=script.product.image_url,
            brand_name=brand_name,
        )
    return ScriptResponse(
        id=script.id,
        user_id=script.user_id,
        product_id=script.product_id,
        hook=script.hook,
        scenes=script.scenes,
        caption=script.caption,
        hashtags=script.hashtags,
        voiceover_text=script.voiceover_text,
        music_vibe=script.music_vibe,
        topic_type=script.topic_type,
        format_type=script.format_type,
        estimated_performance=script.estimated_performance,
        ai_generated=script.ai_generated,
        status=script.status,
        scheduled_date=script.scheduled_date,
        posted_date=script.posted_date,
        performance_notes=script.performance_notes,
        created_at=script.created_at,
        product=product_data,
    )


@router.get("/", response_model=List[ScriptResponse])
def list_scripts(
    status: Optional[str] = None,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Script).filter(Script.user_id == current_user.id).options(
        joinedload(Script.product).joinedload(Product.brand_rel)
    )
    if status:
        q = q.filter(Script.status == status)
    if product_id:
        q = q.filter(Script.product_id == product_id)
    scripts = q.order_by(Script.created_at.desc()).all()
    return [_script_to_response(s) for s in scripts]


@router.post("/", response_model=ScriptResponse)
def create_script(
    script: ScriptCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_script = Script(
        user_id=current_user.id,
        product_id=script.product_id,
        hook=script.hook,
        scenes=script.scenes,
        caption=script.caption,
        hashtags=script.hashtags,
        voiceover_text=script.voiceover_text,
        music_vibe=script.music_vibe,
        topic_type=script.topic_type,
        format_type=script.format_type,
        estimated_performance=script.estimated_performance,
        ai_generated=script.ai_generated,
        status=script.status,
        scheduled_date=script.scheduled_date,
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    s = (
        db.query(Script)
        .options(joinedload(Script.product).joinedload(Product.brand_rel))
        .filter(Script.id == db_script.id)
        .first()
    )
    return _script_to_response(s)


@router.get("/{script_id}", response_model=ScriptResponse)
def get_script(
    script_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    script = (
        db.query(Script)
        .options(joinedload(Script.product).joinedload(Product.brand_rel))
        .filter(Script.id == script_id, Script.user_id == current_user.id)
        .first()
    )
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return _script_to_response(script)


@router.put("/{script_id}", response_model=ScriptResponse)
def update_script(
    script_id: int,
    script_data: ScriptUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    script = db.query(Script).filter(
        Script.id == script_id, Script.user_id == current_user.id
    ).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    for k, v in script_data.model_dump(exclude_unset=True).items():
        setattr(script, k, v)
    db.commit()
    db.refresh(script)
    s = (
        db.query(Script)
        .options(joinedload(Script.product).joinedload(Product.brand_rel))
        .filter(Script.id == script_id)
        .first()
    )
    return _script_to_response(s)


@router.delete("/{script_id}")
def delete_script(
    script_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    script = db.query(Script).filter(
        Script.id == script_id, Script.user_id == current_user.id
    ).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    db.delete(script)
    db.commit()
    return {"message": "Script deleted"}
