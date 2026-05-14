from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Float, Boolean,
    DateTime, JSON, ForeignKey, Numeric, SmallInteger, BigInteger
)
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime
from app.config import settings

_db_url = settings.database_url.replace("postgres://", "postgresql://", 1)
engine = create_engine(_db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id                = Column(Integer, primary_key=True, index=True)
    email             = Column(String(255), unique=True, index=True, nullable=False)
    username          = Column(String(100), unique=True, index=True)
    hashed_password   = Column(String(255), nullable=False)
    role              = Column(String(20), nullable=False, default="user")
    avatar_url        = Column(Text)
    bio               = Column(String(200))
    tiktok_handle     = Column(String(100))
    skin_type         = Column(String(20))
    subscription_plan = Column(String(20), nullable=False, default="free")
    is_active         = Column(Boolean, nullable=False, default=True)
    last_login        = Column(DateTime)
    created_at        = Column(DateTime, default=datetime.utcnow)

    scripts           = relationship("Script", back_populates="user", foreign_keys="Script.user_id")
    videos            = relationship("Video", back_populates="user", foreign_keys="Video.user_id")
    reviews           = relationship("ProductReview", back_populates="user", foreign_keys="ProductReview.user_id")
    products          = relationship("Product", back_populates="creator", foreign_keys="Product.created_by")
    analytics         = relationship("Analytics", back_populates="user", foreign_keys="Analytics.user_id")
    calendar_entries  = relationship("ContentCalendar", back_populates="user", foreign_keys="ContentCalendar.user_id")
    audit_logs        = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    video_assets      = relationship("VideoAsset", back_populates="user", foreign_keys="VideoAsset.user_id")


class Brand(Base):
    __tablename__ = "brands"
    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String(255), nullable=False)
    slug              = Column(String(255), nullable=False, unique=True, index=True)
    description       = Column(Text)
    logo_url          = Column(Text)
    website_url       = Column(Text)
    country_of_origin = Column(String(100))
    created_at        = Column(DateTime, default=datetime.utcnow)

    products          = relationship("Product", back_populates="brand_rel")


class Product(Base):
    __tablename__ = "products"
    id                  = Column(Integer, primary_key=True, index=True)
    brand_id            = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"))
    name                = Column(String(255), nullable=False)
    slug                = Column(String(255), nullable=False, unique=True, index=True)
    category            = Column(String(50), nullable=False, default="other")
    price_range         = Column(String(20))
    size_ml             = Column(Integer)
    key_ingredients     = Column(JSON, default=list)
    skin_concerns       = Column(JSON, default=list)
    suitable_skin_types = Column(JSON, default=list)
    image_url           = Column(Text)
    affiliate_link      = Column(Text)
    full_description    = Column(Text)
    how_to_use          = Column(Text)
    source_url          = Column(Text)
    crawled_at          = Column(DateTime)
    created_by          = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    is_verified         = Column(Boolean, nullable=False, default=False)
    personal_notes      = Column(Text)
    status              = Column(String(50), nullable=False, default="active")
    created_at          = Column(DateTime, default=datetime.utcnow)

    brand_rel           = relationship("Brand", back_populates="products")
    creator             = relationship("User", back_populates="products", foreign_keys=[created_by])
    scripts             = relationship("Script", back_populates="product")
    videos              = relationship("Video", back_populates="product")
    reviews             = relationship("ProductReview", back_populates="product")


class Script(Base):
    __tablename__ = "scripts"
    id                    = Column(Integer, primary_key=True, index=True)
    user_id               = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    product_id            = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"))
    hook                  = Column(Text)
    scenes                = Column(JSON)
    caption               = Column(Text)
    hashtags              = Column(JSON)
    voiceover_text        = Column(Text)
    music_vibe            = Column(String(255))
    topic_type            = Column(String(100))
    format_type           = Column(String(50))
    estimated_performance = Column(String(500))
    ai_generated          = Column(Boolean, nullable=False, default=True)
    status                = Column(String(50), nullable=False, default="draft")
    scheduled_date        = Column(DateTime)
    posted_date           = Column(DateTime)
    performance_notes     = Column(Text)
    created_at            = Column(DateTime, default=datetime.utcnow)

    user             = relationship("User", back_populates="scripts", foreign_keys=[user_id])
    product          = relationship("Product", back_populates="scripts")
    calendar_entries = relationship("ContentCalendar", back_populates="script")
    analytics        = relationship("Analytics", back_populates="script")
    videos           = relationship("Video", back_populates="script")


class Video(Base):
    __tablename__ = "videos"
    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    product_id           = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"))
    script_id            = Column(Integer, ForeignKey("scripts.id", ondelete="SET NULL"))
    title                = Column(String(200))
    video_url            = Column(Text)
    thumbnail_url        = Column(Text)
    platform             = Column(String(20), nullable=False, default="tiktok")
    duration_seconds     = Column(Integer)
    project_type         = Column(String(5))
    status               = Column(String(20), nullable=False, default="draft")
    is_public            = Column(Boolean, nullable=False, default=False)
    view_count           = Column(Integer, nullable=False, default=0)
    tiktok_policy_status = Column(String(20), nullable=False, default="unchecked")
    policy_issues        = Column(JSON, default=list)
    created_at           = Column(DateTime, default=datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user     = relationship("User", back_populates="videos", foreign_keys=[user_id])
    product  = relationship("Product", back_populates="videos")
    script   = relationship("Script", back_populates="videos")
    review   = relationship("ProductReview", back_populates="video", uselist=False, foreign_keys="ProductReview.video_id")
    assets   = relationship("VideoAsset", back_populates="video", foreign_keys="VideoAsset.video_id")
    calendar_entries = relationship("ContentCalendar", back_populates="video", foreign_keys="ContentCalendar.video_id")
    analytics        = relationship("Analytics", back_populates="video", foreign_keys="Analytics.video_id")


class ProductReview(Base):
    __tablename__ = "product_reviews"
    id                   = Column(Integer, primary_key=True, index=True)
    product_id           = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    user_id              = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    video_id             = Column(Integer, ForeignKey("videos.id", ondelete="SET NULL"))
    skin_type            = Column(String(20))
    usage_duration_weeks = Column(Integer)
    purchased_at         = Column(String(100))
    rating_hydration     = Column(SmallInteger)
    rating_texture       = Column(SmallInteger)
    rating_effectiveness = Column(SmallInteger)
    rating_scent         = Column(SmallInteger)
    rating_value         = Column(SmallInteger)
    overall_rating       = Column(Numeric(3, 2))
    is_suitable          = Column(Boolean)
    would_repurchase     = Column(Boolean)
    would_recommend      = Column(Boolean)
    short_note           = Column(String(200))
    is_public            = Column(Boolean, nullable=False, default=False)
    created_at           = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="reviews")
    user    = relationship("User", back_populates="reviews", foreign_keys=[user_id])
    video   = relationship("Video", back_populates="review", foreign_keys=[video_id])


class VideoAsset(Base):
    __tablename__ = "video_assets"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    video_id      = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"))
    file_path     = Column(Text, nullable=False)
    file_size     = Column(BigInteger)
    duration      = Column(Numeric(10, 2))
    clip_type     = Column(String(30))
    thumbnail_url = Column(Text)
    created_at    = Column(DateTime, default=datetime.utcnow)

    user  = relationship("User", back_populates="video_assets", foreign_keys=[user_id])
    video = relationship("Video", back_populates="assets", foreign_keys=[video_id])


class ContentCalendar(Base):
    __tablename__ = "content_calendar"
    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    script_id          = Column(Integer, ForeignKey("scripts.id", ondelete="CASCADE"))
    video_id           = Column(Integer, ForeignKey("videos.id", ondelete="SET NULL"))
    scheduled_date     = Column(DateTime, nullable=False)
    time_slot          = Column(String(50))
    platform           = Column(String(50), nullable=False, default="tiktok")
    status             = Column(String(50), nullable=False, default="planned")
    actual_posted_date = Column(DateTime)

    user   = relationship("User", back_populates="calendar_entries", foreign_keys=[user_id])
    script = relationship("Script", back_populates="calendar_entries")
    video  = relationship("Video", back_populates="calendar_entries", foreign_keys=[video_id])


class Analytics(Base):
    __tablename__ = "analytics"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    script_id     = Column(Integer, ForeignKey("scripts.id", ondelete="CASCADE"))
    video_id      = Column(Integer, ForeignKey("videos.id", ondelete="SET NULL"))
    views         = Column(Integer, nullable=False, default=0)
    likes         = Column(Integer, nullable=False, default=0)
    comments      = Column(Integer, nullable=False, default=0)
    shares        = Column(Integer, nullable=False, default=0)
    saves         = Column(Integer, nullable=False, default=0)
    follower_gain = Column(Integer, nullable=False, default=0)
    recorded_at   = Column(DateTime, default=datetime.utcnow)

    user   = relationship("User", back_populates="analytics", foreign_keys=[user_id])
    script = relationship("Script", back_populates="analytics")
    video  = relationship("Video", back_populates="analytics", foreign_keys=[video_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action      = Column(String(100), nullable=False)
    target_type = Column(String(50))
    target_id   = Column(Integer)
    ip_address  = Column(String(45))
    extra_data  = Column("metadata", JSON)
    created_at  = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])


class TopicTemplate(Base):
    __tablename__ = "topic_templates"
    id                = Column(Integer, primary_key=True, index=True)
    topic_name        = Column(String(255), nullable=False)
    format_type       = Column(String(50))
    prompt_template   = Column(Text)
    example_hook      = Column(Text)
    example_cta       = Column(Text)
    performance_score = Column(Float, default=0.0)
    is_active         = Column(Boolean, default=True)
