import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.database import Brand, Product
from app.dependencies import get_db, get_current_user, require_admin

router = APIRouter()


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


class BrandCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country_of_origin: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country_of_origin: Optional[str] = None


class BrandResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country_of_origin: Optional[str] = None
    created_at: Optional[datetime] = None
    product_count: int = 0

    class Config:
        from_attributes = True


class ProductBasicForBrand(BaseModel):
    id: int
    name: str
    slug: str
    category: str
    image_url: Optional[str] = None
    price_range: Optional[str] = None
    is_verified: bool = False

    class Config:
        from_attributes = True


class BrandDetailResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country_of_origin: Optional[str] = None
    created_at: Optional[datetime] = None
    product_count: int = 0
    products: List[ProductBasicForBrand] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[BrandResponse])
def list_brands(db: Session = Depends(get_db)):
    brands = db.query(Brand).order_by(Brand.name).all()
    result = []
    for brand in brands:
        product_count = (
            db.query(Product)
            .filter(Product.brand_id == brand.id, Product.status == "active")
            .count()
        )
        item = BrandResponse(
            id=brand.id,
            name=brand.name,
            slug=brand.slug,
            description=brand.description,
            logo_url=brand.logo_url,
            website_url=brand.website_url,
            country_of_origin=brand.country_of_origin,
            created_at=brand.created_at,
            product_count=product_count,
        )
        result.append(item)
    return result


@router.get("/{slug}", response_model=BrandDetailResponse)
def get_brand(slug: str, page: int = 1, limit: int = 20, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.slug == slug).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    offset = (page - 1) * limit
    products = (
        db.query(Product)
        .filter(Product.brand_id == brand.id, Product.status == "active")
        .order_by(Product.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    product_count = (
        db.query(Product)
        .filter(Product.brand_id == brand.id, Product.status == "active")
        .count()
    )
    return BrandDetailResponse(
        id=brand.id,
        name=brand.name,
        slug=brand.slug,
        description=brand.description,
        logo_url=brand.logo_url,
        website_url=brand.website_url,
        country_of_origin=brand.country_of_origin,
        created_at=brand.created_at,
        product_count=product_count,
        products=products,
    )


@router.post("/", response_model=BrandResponse)
def create_brand(
    brand_data: BrandCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    slug = brand_data.slug or slugify(brand_data.name)
    if db.query(Brand).filter(Brand.slug == slug).first():
        raise HTTPException(status_code=400, detail="Brand slug already exists")
    brand = Brand(
        name=brand_data.name,
        slug=slug,
        description=brand_data.description,
        logo_url=brand_data.logo_url,
        website_url=brand_data.website_url,
        country_of_origin=brand_data.country_of_origin,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return BrandResponse(
        id=brand.id,
        name=brand.name,
        slug=brand.slug,
        description=brand.description,
        logo_url=brand.logo_url,
        website_url=brand.website_url,
        country_of_origin=brand.country_of_origin,
        created_at=brand.created_at,
        product_count=0,
    )


@router.put("/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    updates = brand_data.model_dump(exclude_unset=True)
    if "name" in updates and "slug" not in updates:
        updates["slug"] = slugify(updates["name"])
    if "slug" in updates:
        existing = db.query(Brand).filter(Brand.slug == updates["slug"], Brand.id != brand_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Brand slug already exists")
    for k, v in updates.items():
        setattr(brand, k, v)
    db.commit()
    db.refresh(brand)
    product_count = (
        db.query(Product)
        .filter(Product.brand_id == brand.id, Product.status == "active")
        .count()
    )
    return BrandResponse(
        id=brand.id,
        name=brand.name,
        slug=brand.slug,
        description=brand.description,
        logo_url=brand.logo_url,
        website_url=brand.website_url,
        country_of_origin=brand.country_of_origin,
        created_at=brand.created_at,
        product_count=product_count,
    )
