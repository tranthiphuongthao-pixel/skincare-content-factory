import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.models.database import Base, engine
from app.routers import auth, brands, products, reviews, videos, scripts, calendar, analytics, generator, admin, dashboard

# Keep create_all for safety in dev; schema.sql manages production schema
Base.metadata.create_all(bind=engine)

os.makedirs("/app/uploads/products", exist_ok=True)

app = FastAPI(title="Skincare Content Factory API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:80", "http://localhost", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(brands.router, prefix="/api/brands", tags=["brands"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(generator.router, prefix="/api/generator", tags=["generator"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])


@app.get("/")
def root():
    return {"message": "Skincare Content Factory API", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/health")
def api_health():
    return {"status": "ok"}
