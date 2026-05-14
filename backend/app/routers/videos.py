from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.database import Video, Product, ProductReview, User, Script
from app.dependencies import get_db, get_current_user, get_current_user_optional
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini = GeminiService()


class UserBasicForVideo(BaseModel):
    id: int
    username: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


class ProductBasicForVideo(BaseModel):
    id: int
    name: str
    slug: str
    image_url: Optional[str]
    brand_name: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewBasicForVideo(BaseModel):
    id: int
    overall_rating: Optional[float]
    rating_hydration: Optional[int]
    rating_texture: Optional[int]
    rating_effectiveness: Optional[int]
    rating_scent: Optional[int]
    rating_value: Optional[int]
    skin_type: Optional[str]
    short_note: Optional[str]
    is_public: bool

    class Config:
        from_attributes = True


class ScriptBasicForVideo(BaseModel):
    id: int
    hook: Optional[str] = None
    scenes: Optional[list] = None
    caption: Optional[str] = None
    hashtags: Optional[list] = None
    voiceover_text: Optional[str] = None
    music_vibe: Optional[str] = None
    topic_type: Optional[str] = None
    format_type: Optional[str] = None

    class Config:
        from_attributes = True


VALID_VIDEO_PROJECT_TYPES = {"A", "B", "C"}

class VideoCreate(BaseModel):
    product_id: int
    script_id: Optional[int] = None
    title: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    platform: str = "tiktok"
    project_type: str = "A"


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    platform: Optional[str] = None
    project_type: Optional[str] = None
    status: Optional[str] = None


class PublishVideoRequest(BaseModel):
    skin_type: str
    usage_duration_weeks: Optional[int] = None
    purchased_at: Optional[str] = None
    rating_hydration: int
    rating_texture: int
    rating_effectiveness: int
    rating_scent: int
    rating_value: int
    is_suitable: Optional[bool] = None
    would_repurchase: Optional[bool] = None
    would_recommend: Optional[bool] = None
    short_note: Optional[str] = None
    video_url: Optional[str] = None


class CheckPolicyRequest(BaseModel):
    pass


class VideoResponse(BaseModel):
    id: int
    user: Optional[UserBasicForVideo]
    product: Optional[ProductBasicForVideo]
    title: Optional[str]
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    platform: str
    status: str
    is_public: bool
    view_count: int
    tiktok_policy_status: str
    policy_issues: Optional[List]
    review: Optional[ReviewBasicForVideo]
    script: Optional[ScriptBasicForVideo] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VideoListResponse(BaseModel):
    items: List[VideoResponse]
    total: int
    page: int
    pages: int


def _calculate_overall_rating(
    rating_hydration: int,
    rating_texture: int,
    rating_effectiveness: int,
    rating_scent: int,
    rating_value: int,
) -> float:
    return round(
        (rating_hydration + rating_texture + rating_effectiveness + rating_scent + rating_value) / 5,
        2,
    )


def _video_to_response(video: Video, db: Session) -> VideoResponse:
    user_data = None
    if video.user:
        user_data = UserBasicForVideo(
            id=video.user.id,
            username=video.user.username,
            avatar_url=video.user.avatar_url,
        )

    product_data = None
    if video.product:
        brand_name = video.product.brand_rel.name if video.product.brand_rel else None
        product_data = ProductBasicForVideo(
            id=video.product.id,
            name=video.product.name,
            slug=video.product.slug,
            image_url=video.product.image_url,
            brand_name=brand_name,
        )

    review_data = None
    if video.review:
        r = video.review
        overall = float(r.overall_rating) if r.overall_rating is not None else None
        review_data = ReviewBasicForVideo(
            id=r.id,
            overall_rating=overall,
            rating_hydration=r.rating_hydration,
            rating_texture=r.rating_texture,
            rating_effectiveness=r.rating_effectiveness,
            rating_scent=r.rating_scent,
            rating_value=r.rating_value,
            skin_type=r.skin_type,
            short_note=r.short_note,
            is_public=r.is_public,
        )

    script_data = None
    if video.script:
        s = video.script
        script_data = ScriptBasicForVideo(
            id=s.id,
            hook=s.hook,
            scenes=s.scenes if isinstance(s.scenes, list) else [],
            caption=s.caption,
            hashtags=s.hashtags if isinstance(s.hashtags, list) else [],
            voiceover_text=s.voiceover_text,
            music_vibe=s.music_vibe,
            topic_type=s.topic_type,
            format_type=s.format_type,
        )

    return VideoResponse(
        id=video.id,
        user=user_data,
        product=product_data,
        title=video.title,
        video_url=video.video_url,
        thumbnail_url=video.thumbnail_url,
        platform=video.platform,
        status=video.status,
        is_public=video.is_public,
        view_count=video.view_count,
        tiktok_policy_status=video.tiktok_policy_status,
        policy_issues=video.policy_issues or [],
        review=review_data,
        script=script_data,
        created_at=video.created_at,
    )


@router.get("/public", response_model=VideoListResponse)
def get_public_videos(
    product_id: Optional[int] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    q = db.query(Video).filter(Video.is_public == True)
    if product_id:
        q = q.filter(Video.product_id == product_id)
    total = q.count()
    videos = q.order_by(Video.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit
    items = [_video_to_response(v, db) for v in videos]
    return VideoListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/my", response_model=VideoListResponse)
def get_my_videos(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Video).filter(Video.user_id == current_user.id)
    total = q.count()
    videos = q.order_by(Video.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit
    items = [_video_to_response(v, db) for v in videos]
    return VideoListResponse(items=items, total=total, page=page, pages=pages)


@router.post("/", response_model=VideoResponse)
def create_video(
    video_data: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == video_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if video_data.script_id:
        script = db.query(Script).filter(Script.id == video_data.script_id).first()
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")

    project_type = video_data.project_type if video_data.project_type in VALID_VIDEO_PROJECT_TYPES else "A"
    video = Video(
        user_id=current_user.id,
        product_id=video_data.product_id,
        script_id=video_data.script_id,
        title=video_data.title,
        video_url=video_data.video_url,
        thumbnail_url=video_data.thumbnail_url,
        platform=video_data.platform,
        project_type=project_type,
        status="draft",
        is_public=False,
        policy_issues=[],
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return _video_to_response(video, db)


@router.put("/{video_id}", response_model=VideoResponse)
def update_video(
    video_id: int,
    video_data: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this video")

    for k, v in video_data.model_dump(exclude_unset=True).items():
        setattr(video, k, v)
    video.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(video)
    return _video_to_response(video, db)


@router.put("/{video_id}/publish", response_model=VideoResponse)
def publish_video(
    video_id: int,
    publish_data: PublishVideoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to publish this video")
    if not video.product_id:
        raise HTTPException(status_code=400, detail="Video must be linked to a product")

    if publish_data.video_url:
        video.video_url = publish_data.video_url

    overall = _calculate_overall_rating(
        publish_data.rating_hydration,
        publish_data.rating_texture,
        publish_data.rating_effectiveness,
        publish_data.rating_scent,
        publish_data.rating_value,
    )

    review = db.query(ProductReview).filter(ProductReview.video_id == video_id).first()
    if review:
        review.skin_type = publish_data.skin_type
        review.usage_duration_weeks = publish_data.usage_duration_weeks
        review.purchased_at = publish_data.purchased_at
        review.rating_hydration = publish_data.rating_hydration
        review.rating_texture = publish_data.rating_texture
        review.rating_effectiveness = publish_data.rating_effectiveness
        review.rating_scent = publish_data.rating_scent
        review.rating_value = publish_data.rating_value
        review.overall_rating = overall
        review.is_suitable = publish_data.is_suitable
        review.would_repurchase = publish_data.would_repurchase
        review.would_recommend = publish_data.would_recommend
        review.short_note = publish_data.short_note
        review.is_public = True
    else:
        review = ProductReview(
            product_id=video.product_id,
            user_id=current_user.id,
            video_id=video.id,
            skin_type=publish_data.skin_type,
            usage_duration_weeks=publish_data.usage_duration_weeks,
            purchased_at=publish_data.purchased_at,
            rating_hydration=publish_data.rating_hydration,
            rating_texture=publish_data.rating_texture,
            rating_effectiveness=publish_data.rating_effectiveness,
            rating_scent=publish_data.rating_scent,
            rating_value=publish_data.rating_value,
            overall_rating=overall,
            is_suitable=publish_data.is_suitable,
            would_repurchase=publish_data.would_repurchase,
            would_recommend=publish_data.would_recommend,
            short_note=publish_data.short_note,
            is_public=True,
        )
        db.add(review)

    video.is_public = True
    video.status = "posted"
    video.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(video)
    return _video_to_response(video, db)


@router.put("/{video_id}/unpublish", response_model=VideoResponse)
def unpublish_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    video.is_public = False
    video.status = "ready"  # revert to ready so user can edit/republish
    video.updated_at = datetime.utcnow()

    # Hide the associated review from community too
    review = db.query(ProductReview).filter(ProductReview.video_id == video_id).first()
    if review:
        review.is_public = False

    db.commit()
    db.refresh(video)
    return _video_to_response(video, db)


@router.delete("/{video_id}")
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this video")
    db.delete(video)
    db.commit()
    return {"message": "Video deleted"}


@router.post("/{video_id}/check-policy")
async def check_video_policy(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    script_content = ""
    caption = ""
    hashtags = []

    if video.script:
        script = video.script
        if script.hook:
            script_content += script.hook + "\n"
        if script.voiceover_text:
            script_content += script.voiceover_text + "\n"
        if script.caption:
            caption = script.caption
        if script.hashtags:
            hashtags = script.hashtags if isinstance(script.hashtags, list) else []

    policy_result = await gemini.check_policy(script_content, caption, hashtags)

    risk_level = policy_result.get("risk_level", "safe")
    if risk_level == "safe":
        video.tiktok_policy_status = "safe"
    elif risk_level == "warning":
        video.tiktok_policy_status = "warning"
    elif risk_level == "danger":
        video.tiktok_policy_status = "danger"
    else:
        video.tiktok_policy_status = "unchecked"

    video.policy_issues = policy_result.get("issues", [])
    video.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(video)

    return policy_result
