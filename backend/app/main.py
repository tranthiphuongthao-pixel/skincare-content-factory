import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import text
from app.models.database import Base, engine, SessionLocal
from app.routers import auth, brands, products, reviews, videos, scripts, calendar, analytics, generator, admin, dashboard

Base.metadata.create_all(bind=engine)

os.makedirs("/app/uploads/products", exist_ok=True)


def _seed_database():
    db = SessionLocal()
    try:
        # Backfill any rows missing created_at so Pydantic response models don't 500
        db.execute(text("UPDATE brands SET created_at = NOW() WHERE created_at IS NULL"))
        if db.execute(text("SELECT COUNT(*) FROM brands")).scalar() == 0:
            db.execute(text("""
                INSERT INTO brands (name, slug, description, country_of_origin, created_at) VALUES
                  ('Some By Mi',     'some-by-mi',     'K-beauty brand nổi tiếng với AHA BHA PHA', 'Hàn Quốc', NOW()),
                  ('Laneige',        'laneige',        'Premium K-beauty hydration specialist',     'Hàn Quốc', NOW()),
                  ('The Ordinary',   'the-ordinary',   'Affordable clinical formulations',          'Canada',   NOW()),
                  ('Innisfree',      'innisfree',      'Natural beauty from Jeju Island',           'Hàn Quốc', NOW()),
                  ('Klairs',         'klairs',         'Gentle skincare for sensitive skin',        'Hàn Quốc', NOW()),
                  ('Paula''s Choice','paulas-choice',  'Research-backed skincare',                  'USA',      NOW())
                ON CONFLICT (slug) DO NOTHING
            """))
        if db.execute(text("SELECT COUNT(*) FROM topic_templates")).scalar() == 0:
            db.execute(text("""
                INSERT INTO topic_templates (topic_name, format_type, example_hook, performance_score) VALUES
                  ('honest_review',        'text_on_screen', 'Tôi đã dùng thử và đây là sự thật...', 9.2),
                  ('ingredient_breakdown', 'voiceover',      'Thành phần này có thể gây hại cho da bạn!', 8.5),
                  ('before_after',         'text_on_screen', 'Da tôi sau 30 ngày dùng sản phẩm này...', 9.0),
                  ('comparison',           'voiceover',      'Tôi thử 5 sản phẩm và đây là kết quả...', 8.8),
                  ('routine_feature',      'text_on_screen', 'Routine giúp da tôi sáng mịn mỗi sáng', 7.5),
                  ('red_flag_check',       'voiceover',      'DỪNG LẠI! Đừng dùng sản phẩm này nếu...', 9.5),
                  ('dupe_finder',          'text_on_screen', 'Chỉ 200K mà hiệu quả như hàng 2 triệu', 9.3),
                  ('community_review',     'voiceover',      '1000 người đã thử và đây là phản hồi...', 8.0)
            """))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[seed] warning: {e}")
    finally:
        db.close()


_seed_database()

app = FastAPI(title="Skincare Content Factory API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

app.include_router(auth.router,       prefix="/api/auth",      tags=["auth"])
app.include_router(brands.router,     prefix="/api/brands",    tags=["brands"])
app.include_router(products.router,   prefix="/api/products",  tags=["products"])
app.include_router(reviews.router,    prefix="/api/reviews",   tags=["reviews"])
app.include_router(videos.router,     prefix="/api/videos",    tags=["videos"])
app.include_router(scripts.router,    prefix="/api/scripts",   tags=["scripts"])
app.include_router(calendar.router,   prefix="/api/calendar",  tags=["calendar"])
app.include_router(analytics.router,  prefix="/api/analytics", tags=["analytics"])
app.include_router(generator.router,  prefix="/api/generator", tags=["generator"])
app.include_router(admin.router,      prefix="/api/admin",     tags=["admin"])
app.include_router(dashboard.router,  prefix="/api/dashboard", tags=["dashboard"])


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok"}


# SPA catch-all — serves React app for all non-API, non-static paths.
# GET-only: POST/PUT/DELETE to /api/* without trailing slash falls through to
# FastAPI's redirect_slashes (which 307-redirects to /api/*/).
_STATIC = Path("/app/static")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # API paths must NEVER be served the SPA fallback. For /api/X (no trailing
    # slash), redirect to /api/X/ so the router's "/" routes can handle it.
    # This is the GET equivalent of FastAPI's redirect_slashes (which only
    # fires when no route matches — but this catch-all always matches).
    if full_path == "api" or full_path.startswith("api/"):
        if not full_path.endswith("/"):
            return RedirectResponse(url=f"/{full_path}/", status_code=307)
        raise HTTPException(status_code=404, detail="API endpoint not found")
    candidate = _STATIC / full_path
    if candidate.is_file():
        return FileResponse(candidate)
    index = _STATIC / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"message": "Skincare Content Factory API", "version": "2.0.0"}
