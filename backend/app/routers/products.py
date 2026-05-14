import re
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.database import Product, Brand, ProductReview, Video, User
from app.dependencies import get_db, get_current_user, get_current_user_optional

UPLOAD_DIR = "/app/uploads/products"
MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

router = APIRouter()


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _make_product_slug(brand_name: str, product_name: str, db: Session) -> str:
    base = slugify(f"{brand_name} {product_name}")
    slug = base
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base}-{counter}"
        counter += 1
    return slug


def _normalize_category(value: Optional[str]) -> str:
    if not value:
        return "other"
    normalized = value.strip().lower().replace(" ", "_")
    if normalized in {"eye_care", "eye_cream", "eyecream"}:
        return "eye_care"
    if normalized in {"sunscreen", "spf"}:
        return "sunscreen"
    if normalized in {"other", "khác", "khac", "oil"}:
        return "other"
    if normalized in {"serum", "moisturizer", "cleanser", "toner", "mask", "essence"}:
        return normalized
    return "other"


def _normalize_price_range(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    normalized = value.strip().lower().replace(" ", "").replace("-", "_").replace("to", "_").replace("k", "k")
    if normalized in {"under200k", "under_200k", "under200k", "under_200k"}:
        return "under_200k"
    if normalized in {"200k500k", "200k_500k", "200k - 500k"}:
        return "200k_500k"
    if normalized in {"500k1m", "500k_1m", "500k - 1m"}:
        return "500k_1m"
    if normalized in {"over1m", "over_1m", "over 1m"}:
        return "over_1m"
    return None


class BrandBasic(BaseModel):
    id: int
    name: str
    slug: str
    country_of_origin: Optional[str]

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    brand_id: Optional[int] = None
    name: str
    category: str = "other"
    price_range: Optional[str] = None
    size_ml: Optional[int] = None
    key_ingredients: Optional[List[str]] = []
    skin_concerns: Optional[List[str]] = []
    suitable_skin_types: Optional[List[str]] = []
    image_url: Optional[str] = None
    affiliate_link: Optional[str] = None
    full_description: Optional[str] = None
    how_to_use: Optional[str] = None
    personal_notes: Optional[str] = None
    status: str = "active"


class ProductUpdate(BaseModel):
    brand_id: Optional[int] = None
    name: Optional[str] = None
    category: Optional[str] = None
    price_range: Optional[str] = None
    size_ml: Optional[int] = None
    key_ingredients: Optional[List[str]] = None
    skin_concerns: Optional[List[str]] = None
    suitable_skin_types: Optional[List[str]] = None
    image_url: Optional[str] = None
    affiliate_link: Optional[str] = None
    full_description: Optional[str] = None
    how_to_use: Optional[str] = None
    personal_notes: Optional[str] = None
    status: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    brand: Optional[BrandBasic]
    name: str
    slug: str
    category: str
    price_range: Optional[str]
    size_ml: Optional[int]
    key_ingredients: Optional[List]
    skin_concerns: Optional[List]
    suitable_skin_types: Optional[List]
    image_url: Optional[str]
    affiliate_link: Optional[str]
    full_description: Optional[str]
    how_to_use: Optional[str]
    is_verified: bool
    status: str
    overall_rating: Optional[float]
    review_count: int
    video_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    pages: int


def _build_product_response(product: Product, db: Session) -> ProductResponse:
    rating_row = (
        db.query(func.avg(ProductReview.overall_rating))
        .filter(ProductReview.product_id == product.id, ProductReview.is_public == True)
        .scalar()
    )
    overall_rating = float(rating_row) if rating_row is not None else None

    review_count = (
        db.query(ProductReview)
        .filter(ProductReview.product_id == product.id, ProductReview.is_public == True)
        .count()
    )

    video_count = (
        db.query(Video)
        .filter(Video.product_id == product.id, Video.is_public == True)
        .count()
    )

    brand = None
    if product.brand_rel:
        brand = BrandBasic(
            id=product.brand_rel.id,
            name=product.brand_rel.name,
            slug=product.brand_rel.slug,
            country_of_origin=product.brand_rel.country_of_origin,
        )

    return ProductResponse(
        id=product.id,
        brand=brand,
        name=product.name,
        slug=product.slug,
        category=product.category,
        price_range=product.price_range,
        size_ml=product.size_ml,
        key_ingredients=product.key_ingredients,
        skin_concerns=product.skin_concerns,
        suitable_skin_types=product.suitable_skin_types,
        image_url=product.image_url,
        affiliate_link=product.affiliate_link,
        full_description=product.full_description,
        how_to_use=product.how_to_use,
        is_verified=product.is_verified,
        status=product.status,
        overall_rating=round(overall_rating, 2) if overall_rating is not None else None,
        review_count=review_count,
        video_count=video_count,
        created_at=product.created_at,
    )


@router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận jpg, jpeg, png, webp")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File quá lớn. Tối đa 5MB")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"image_url": f"/uploads/products/{filename}"}


@router.get("/", response_model=ProductListResponse)
def list_products(
    brand_slug: Optional[str] = None,
    category: Optional[str] = None,
    skin_concern: Optional[str] = None,
    price_range: Optional[str] = None,
    skin_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    q = db.query(Product).filter(Product.status == "active")

    if brand_slug:
        brand = db.query(Brand).filter(Brand.slug == brand_slug).first()
        if brand:
            q = q.filter(Product.brand_id == brand.id)
        else:
            q = q.filter(Product.brand_id == -1)

    if category:
        q = q.filter(Product.category == category)

    if price_range:
        q = q.filter(Product.price_range == price_range)

    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))

    if skin_concern:
        q = q.filter(Product.skin_concerns.contains([skin_concern]))

    if skin_type:
        q = q.filter(Product.suitable_skin_types.contains([skin_type]))

    total = q.count()
    products = q.order_by(Product.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit

    items = [_build_product_response(p, db) for p in products]
    return ProductListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/my", response_model=ProductListResponse)
def my_products(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Product).filter(Product.created_by == current_user.id)
    total = q.count()
    products = q.order_by(Product.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit
    items = [_build_product_response(p, db) for p in products]
    return ProductListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/{slug}", response_model=ProductResponse)
def get_product(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _build_product_response(product, db)


@router.post("/", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Free plan limit: max 10 products per user
    if current_user.subscription_plan == "free":
        user_product_count = (
            db.query(Product).filter(Product.created_by == current_user.id).count()
        )
        if user_product_count >= 10:
            raise HTTPException(
                status_code=403,
                detail="Free plan limit: maximum 10 products. Upgrade to Pro for unlimited products.",
            )

    brand_name = ""
    if product_data.brand_id:
        brand = db.query(Brand).filter(Brand.id == product_data.brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        brand_name = brand.name

    slug = _make_product_slug(brand_name, product_data.name, db)
    category = _normalize_category(product_data.category)
    price_range = _normalize_price_range(product_data.price_range)

    product = Product(
        brand_id=product_data.brand_id,
        name=product_data.name,
        slug=slug,
        category=category,
        price_range=price_range,
        size_ml=product_data.size_ml,
        key_ingredients=product_data.key_ingredients or [],
        skin_concerns=product_data.skin_concerns or [],
        suitable_skin_types=product_data.suitable_skin_types or [],
        image_url=product_data.image_url,
        affiliate_link=product_data.affiliate_link,
        full_description=product_data.full_description,
        how_to_use=product_data.how_to_use,
        personal_notes=product_data.personal_notes,
        status=product_data.status,
        created_by=current_user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return _build_product_response(product, db)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this product")

    updates = product_data.model_dump(exclude_unset=True)
    if "category" in updates:
        updates["category"] = _normalize_category(updates["category"])
    if "price_range" in updates:
        updates["price_range"] = _normalize_price_range(updates["price_range"])
    for k, v in updates.items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return _build_product_response(product, db)
