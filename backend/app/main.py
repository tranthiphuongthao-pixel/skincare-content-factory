import os
  from pathlib import Path
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  from fastapi.staticfiles import StaticFiles
  from fastapi.responses import FileResponse
  from sqlalchemy import text
  from app.models.database import Base, engine, SessionLocal
  from app.routers import auth, brands, products, reviews, videos, scripts, calendar, analytics, generator, admin,
  dashboard

  Base.metadata.create_all(bind=engine)

  os.makedirs("/app/uploads/products", exist_ok=True)


  def _seed_database():
      db = SessionLocal()
      try:
          if db.execute(text("SELECT COUNT(*) FROM brands")).scalar() == 0:
              db.execute(text("""
                  INSERT INTO brands (name, slug, description, country_of_origin) VALUES
                    ('Some By Mi',     'some-by-mi',     'K-beauty brand noi tieng voi AHA BHA PHA', 'Han Quoc'),
                    ('Laneige',        'laneige',        'Premium K-beauty hydration specialist',     'Han Quoc'),
                    ('The Ordinary',   'the-ordinary',   'Affordable clinical formulations',          'Canada'),
                    ('Innisfree',      'innisfree',      'Natural beauty from Jeju Island',           'Han Quoc'),
                    ('Klairs',         'klairs',         'Gentle skincare for sensitive skin',        'Han Quoc'),
                    ('Paula''s Choice','paulas-choice',  'Research-backed skincare',                  'USA')
                  ON CONFLICT (slug) DO NOTHING
              """))
          if db.execute(text("SELECT COUNT(*) FROM topic_templates")).scalar() == 0:
              db.execute(text("""
                  INSERT INTO topic_templates (topic_name, format_type, example_hook, performance_score) VALUES
                    ('honest_review',        'text_on_screen', 'Toi da dung thu va day la su that...', 9.2),
                    ('ingredient_breakdown', 'voiceover',      'Thanh phan nay co the gay hai cho da ban!', 8.5),
                    ('before_after',         'text_on_screen', 'Da toi sau 30 ngay dung san pham nay...', 9.0),
                    ('comparison',           'voiceover',      'Toi thu 5 san pham va day la ket qua...', 8.8),
                    ('routine_feature',      'text_on_screen', 'Routine giup da toi sang min moi sang', 7.5),
                    ('red_flag_check',       'voiceover',      'DUNG LAI! Dung dung san pham nay neu...', 9.5),
                    ('dupe_finder',          'text_on_screen', 'Chi 200K ma hieu qua nhu hang 2 trieu', 9.3),
                    ('community_review',     'voiceover',      '1000 nguoi da thu va day la phan hoi...', 8.0)
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


  _STATIC = Path("/app/static")


  @app.get("/{full_path:path}")
  async def serve_spa(full_path: str):
      candidate = _STATIC / full_path
      if candidate.is_file():
          return FileResponse(candidate)
      index = _STATIC / "index.html"
      if index.exists():
          return FileResponse(index)
      return {"message": "Skincare Content Factory API", "version": "2.0.0"}
