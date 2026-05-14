from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from calendar import monthrange
from pydantic import BaseModel
from app.models.database import Script, Product, ContentCalendar
from app.dependencies import get_db, get_current_user
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini = GeminiService()

FREE_PLAN_MONTHLY_LIMIT = 20


def _check_monthly_script_limit(current_user, db: Session):
    if current_user.subscription_plan == "free":
        now = datetime.utcnow()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        count = (
            db.query(Script)
            .filter(Script.user_id == current_user.id, Script.created_at >= first_day)
            .count()
        )
        if count >= FREE_PLAN_MONTHLY_LIMIT:
            raise HTTPException(
                status_code=403,
                detail=f"Free plan limit: {FREE_PLAN_MONTHLY_LIMIT} scripts per month. Upgrade to Pro for unlimited scripts.",
            )


class GenerateScriptRequest(BaseModel):
    product_id: int
    format_type: str = "text_on_screen"
    topic_type: str = "honest_review"


class GenerateDualRequest(BaseModel):
    product_id: int
    topic_types: Optional[List[str]] = None


class RegenerateOneRequest(BaseModel):
    product_id: int
    format_type: str
    topic_type: str
    previous_script_id: Optional[int] = None


class ImproveHookRequest(BaseModel):
    hook: str
    product_name: str


class GenerateHashtagsRequest(BaseModel):
    product_id: int
    topic_type: str


class GenerateCalendarRequest(BaseModel):
    product_ids: List[int]
    month: int
    year: int


class AnalyzePerformanceRequest(BaseModel):
    analytics_data: list


class CheckPolicyRequest(BaseModel):
    script_content: str
    caption: str
    hashtags: List[str]


@router.post("/script")
async def generate_script(
    req: GenerateScriptRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_monthly_script_limit(current_user, db)
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    result = await gemini.generate_script(product, req.format_type, req.topic_type)
    db_script = Script(
        user_id=current_user.id,
        product_id=product.id,
        hook=result.get("hook"),
        scenes=result.get("scenes"),
        caption=result.get("caption"),
        hashtags=result.get("hashtags"),
        voiceover_text=result.get("voiceover_text"),
        music_vibe=result.get("music_vibe"),
        topic_type=req.topic_type,
        format_type=req.format_type,
        estimated_performance=result.get("estimated_performance"),
        ai_generated=True,
        status="draft",
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    result["script_id"] = db_script.id
    return result


@router.post("/generate-dual")
async def generate_dual(
    req: GenerateDualRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_monthly_script_limit(current_user, db)
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    topic_types = req.topic_types or ["honest_review", "comparison"]
    if len(topic_types) < 2:
        topic_types = [topic_types[0], "comparison"] if topic_types else ["honest_review", "comparison"]

    topic_a = topic_types[0]
    topic_b = topic_types[1]

    result_a = await gemini.generate_script(product, "text_on_screen", topic_a)
    script_a = Script(
        user_id=current_user.id,
        product_id=product.id,
        hook=result_a.get("hook"),
        scenes=result_a.get("scenes"),
        caption=result_a.get("caption"),
        hashtags=result_a.get("hashtags"),
        voiceover_text=result_a.get("voiceover_text"),
        music_vibe=result_a.get("music_vibe"),
        topic_type=topic_a,
        format_type="text_on_screen",
        estimated_performance=result_a.get("estimated_performance"),
        ai_generated=True,
        status="draft",
    )
    db.add(script_a)
    db.commit()
    db.refresh(script_a)
    result_a["script_id"] = script_a.id

    result_b = await gemini.generate_script(product, "voiceover", topic_b)
    script_b = Script(
        user_id=current_user.id,
        product_id=product.id,
        hook=result_b.get("hook"),
        scenes=result_b.get("scenes"),
        caption=result_b.get("caption"),
        hashtags=result_b.get("hashtags"),
        voiceover_text=result_b.get("voiceover_text"),
        music_vibe=result_b.get("music_vibe"),
        topic_type=topic_b,
        format_type="voiceover",
        estimated_performance=result_b.get("estimated_performance"),
        ai_generated=True,
        status="draft",
    )
    db.add(script_b)
    db.commit()
    db.refresh(script_b)
    result_b["script_id"] = script_b.id

    return {"option_a": result_a, "option_b": result_b}


@router.post("/regenerate-one")
async def regenerate_one(
    req: RegenerateOneRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_monthly_script_limit(current_user, db)
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await gemini.generate_script(product, req.format_type, req.topic_type)
    db_script = Script(
        user_id=current_user.id,
        product_id=product.id,
        hook=result.get("hook"),
        scenes=result.get("scenes"),
        caption=result.get("caption"),
        hashtags=result.get("hashtags"),
        voiceover_text=result.get("voiceover_text"),
        music_vibe=result.get("music_vibe"),
        topic_type=req.topic_type,
        format_type=req.format_type,
        estimated_performance=result.get("estimated_performance"),
        ai_generated=True,
        status="draft",
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    result["script_id"] = db_script.id
    return result


@router.post("/check-policy")
async def check_policy(
    req: CheckPolicyRequest,
    current_user=Depends(get_current_user),
):
    return await gemini.check_policy(req.script_content, req.caption, req.hashtags)


@router.post("/improve-hook")
async def improve_hook(
    req: ImproveHookRequest,
    current_user=Depends(get_current_user),
):
    return await gemini.improve_hook(req.hook, req.product_name)


@router.post("/hashtags")
async def generate_hashtags(
    req: GenerateHashtagsRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return await gemini.generate_hashtags(product, req.topic_type)


@router.post("/calendar")
async def generate_monthly_calendar(
    req: GenerateCalendarRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).filter(Product.id.in_(req.product_ids)).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found")
    return await gemini.generate_monthly_calendar(products, req.month, req.year)


@router.post("/analyze-performance")
async def analyze_performance(
    req: AnalyzePerformanceRequest,
    current_user=Depends(get_current_user),
):
    return await gemini.analyze_best_content(req.analytics_data)
