from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.database import ProductReview, Product, User
from app.dependencies import get_db, get_current_user, get_current_user_optional

router = APIRouter()


class ReviewCreate(BaseModel):
    product_id: int
    video_id: Optional[int] = None
    skin_type: Optional[str] = None
    usage_duration_weeks: Optional[int] = None
    purchased_at: Optional[str] = None
    rating_hydration: Optional[int] = None
    rating_texture: Optional[int] = None
    rating_effectiveness: Optional[int] = None
    rating_scent: Optional[int] = None
    rating_value: Optional[int] = None
    is_suitable: Optional[bool] = None
    would_repurchase: Optional[bool] = None
    would_recommend: Optional[bool] = None
    short_note: Optional[str] = None


class ReviewUpdate(BaseModel):
    skin_type: Optional[str] = None
    usage_duration_weeks: Optional[int] = None
    purchased_at: Optional[str] = None
    rating_hydration: Optional[int] = None
    rating_texture: Optional[int] = None
    rating_effectiveness: Optional[int] = None
    rating_scent: Optional[int] = None
    rating_value: Optional[int] = None
    is_suitable: Optional[bool] = None
    would_repurchase: Optional[bool] = None
    would_recommend: Optional[bool] = None
    short_note: Optional[str] = None


class UserBasicForReview(BaseModel):
    id: int
    username: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    video_id: Optional[int]
    skin_type: Optional[str]
    usage_duration_weeks: Optional[int]
    purchased_at: Optional[str]
    rating_hydration: Optional[int]
    rating_texture: Optional[int]
    rating_effectiveness: Optional[int]
    rating_scent: Optional[int]
    rating_value: Optional[int]
    overall_rating: Optional[float]
    is_suitable: Optional[bool]
    would_repurchase: Optional[bool]
    would_recommend: Optional[bool]
    short_note: Optional[str]
    is_public: bool
    created_at: datetime
    user: Optional[UserBasicForReview]

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    items: List[ReviewResponse]
    total: int
    page: int
    pages: int


def _calculate_overall_rating(
    rating_hydration: Optional[int],
    rating_texture: Optional[int],
    rating_effectiveness: Optional[int],
    rating_scent: Optional[int],
    rating_value: Optional[int],
) -> Optional[float]:
    ratings = [r for r in [rating_hydration, rating_texture, rating_effectiveness, rating_scent, rating_value] if r is not None]
    if not ratings:
        return None
    return round(sum(ratings) / len(ratings), 2)


def _review_to_response(review: ProductReview) -> ReviewResponse:
    overall = float(review.overall_rating) if review.overall_rating is not None else None
    user_data = None
    if review.user:
        user_data = UserBasicForReview(
            id=review.user.id,
            username=review.user.username,
            avatar_url=review.user.avatar_url,
        )
    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        video_id=review.video_id,
        skin_type=review.skin_type,
        usage_duration_weeks=review.usage_duration_weeks,
        purchased_at=review.purchased_at,
        rating_hydration=review.rating_hydration,
        rating_texture=review.rating_texture,
        rating_effectiveness=review.rating_effectiveness,
        rating_scent=review.rating_scent,
        rating_value=review.rating_value,
        overall_rating=overall,
        is_suitable=review.is_suitable,
        would_repurchase=review.would_repurchase,
        would_recommend=review.would_recommend,
        short_note=review.short_note,
        is_public=review.is_public,
        created_at=review.created_at,
        user=user_data,
    )


@router.post("/", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == review_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    overall = _calculate_overall_rating(
        review_data.rating_hydration,
        review_data.rating_texture,
        review_data.rating_effectiveness,
        review_data.rating_scent,
        review_data.rating_value,
    )

    review = ProductReview(
        product_id=review_data.product_id,
        user_id=current_user.id,
        video_id=review_data.video_id,
        skin_type=review_data.skin_type,
        usage_duration_weeks=review_data.usage_duration_weeks,
        purchased_at=review_data.purchased_at,
        rating_hydration=review_data.rating_hydration,
        rating_texture=review_data.rating_texture,
        rating_effectiveness=review_data.rating_effectiveness,
        rating_scent=review_data.rating_scent,
        rating_value=review_data.rating_value,
        overall_rating=overall,
        is_suitable=review_data.is_suitable,
        would_repurchase=review_data.would_repurchase,
        would_recommend=review_data.would_recommend,
        short_note=review_data.short_note,
        is_public=False,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return _review_to_response(review)


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(ProductReview).filter(ProductReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")

    updates = review_data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(review, k, v)

    review.overall_rating = _calculate_overall_rating(
        review.rating_hydration,
        review.rating_texture,
        review.rating_effectiveness,
        review.rating_scent,
        review.rating_value,
    )
    db.commit()
    db.refresh(review)
    return _review_to_response(review)


@router.put("/{review_id}/publish", response_model=ReviewResponse)
def publish_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(ProductReview).filter(ProductReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to publish this review")

    missing = []
    if review.skin_type is None:
        missing.append("skin_type")
    for field in ["rating_hydration", "rating_texture", "rating_effectiveness", "rating_scent", "rating_value"]:
        if getattr(review, field) is None:
            missing.append(field)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields to publish: {', '.join(missing)}",
        )

    review.is_public = True
    db.commit()
    db.refresh(review)
    return _review_to_response(review)


@router.get("/product/{product_id}", response_model=ReviewListResponse)
def get_product_reviews(
    product_id: int,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    q = db.query(ProductReview).filter(
        ProductReview.product_id == product_id,
        ProductReview.is_public == True,
    )
    total = q.count()
    reviews = q.order_by(ProductReview.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit

    items = [_review_to_response(r) for r in reviews]
    return ReviewListResponse(items=items, total=total, page=page, pages=pages)
