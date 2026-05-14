-- Skincare Content Factory — Community Platform Schema
-- PostgreSQL 15

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                SERIAL PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    username          VARCHAR(100) UNIQUE,
    hashed_password   VARCHAR(255) NOT NULL,
    role              VARCHAR(20)  NOT NULL DEFAULT 'user'
                          CHECK (role IN ('admin','user')),
    avatar_url        TEXT,
    bio               VARCHAR(200),
    tiktok_handle     VARCHAR(100),
    skin_type         VARCHAR(20)
                          CHECK (skin_type IN ('oily','dry','combo','sensitive','normal')),
    subscription_plan VARCHAR(20)  NOT NULL DEFAULT 'free'
                          CHECK (subscription_plan IN ('free','pro')),
    is_active         BOOLEAN      NOT NULL DEFAULT true,
    last_login        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    slug              VARCHAR(255) NOT NULL UNIQUE,
    description       TEXT,
    logo_url          TEXT,
    website_url       TEXT,
    country_of_origin VARCHAR(100),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands (slug);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id                   SERIAL PRIMARY KEY,
    brand_id             INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    name                 VARCHAR(255) NOT NULL,
    slug                 VARCHAR(255) NOT NULL UNIQUE,
    category             VARCHAR(50)  NOT NULL DEFAULT 'other'
                             CHECK (category IN ('serum','moisturizer','cleanser','toner','sunscreen','mask','eye_care','essence','other')),
    price_range          VARCHAR(20)
                             CHECK (price_range IN ('under_200k','200k_500k','500k_1m','over_1m')),
    size_ml              INTEGER,
    key_ingredients      JSONB        NOT NULL DEFAULT '[]',
    skin_concerns        JSONB        NOT NULL DEFAULT '[]',
    suitable_skin_types  JSONB        NOT NULL DEFAULT '[]',
    image_url            TEXT,
    affiliate_link       TEXT,
    full_description     TEXT,
    how_to_use           TEXT,
    source_url           TEXT,
    crawled_at           TIMESTAMPTZ,
    created_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_verified          BOOLEAN      NOT NULL DEFAULT false,
    personal_notes       TEXT,
    status               VARCHAR(50)  NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','archived')),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug     ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_brand    ON products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products (status);

-- ============================================================
-- SCRIPTS (keep existing structure)
-- ============================================================
CREATE TABLE IF NOT EXISTS scripts (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id            INTEGER REFERENCES products(id) ON DELETE SET NULL,
    hook                  TEXT,
    scenes                JSONB,
    caption               TEXT,
    hashtags              JSONB,
    voiceover_text        TEXT,
    music_vibe            VARCHAR(255),
    topic_type            VARCHAR(100),
    format_type           VARCHAR(50),
    estimated_performance VARCHAR(500),
    ai_generated          BOOLEAN     NOT NULL DEFAULT true,
    status                VARCHAR(50) NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','ready','posted')),
    scheduled_date        TIMESTAMPTZ,
    posted_date           TIMESTAMPTZ,
    performance_notes     TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scripts_user    ON scripts (user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_product ON scripts (product_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status  ON scripts (status);
CREATE INDEX IF NOT EXISTS idx_scripts_created ON scripts (created_at DESC);

-- ============================================================
-- VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id           INTEGER REFERENCES products(id) ON DELETE SET NULL,
    script_id            INTEGER REFERENCES scripts(id) ON DELETE SET NULL,
    title                VARCHAR(200),
    video_url            TEXT,
    thumbnail_url        TEXT,
    platform             VARCHAR(20) NOT NULL DEFAULT 'tiktok'
                             CHECK (platform IN ('tiktok','youtube','instagram','other')),
    duration_seconds     INTEGER,
    project_type         VARCHAR(5)
                             CHECK (project_type IN ('A','B','C')),
    status               VARCHAR(20) NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','processing','ready','posted')),
    is_public            BOOLEAN     NOT NULL DEFAULT false,
    view_count           INTEGER     NOT NULL DEFAULT 0,
    tiktok_policy_status VARCHAR(20) NOT NULL DEFAULT 'unchecked'
                             CHECK (tiktok_policy_status IN ('unchecked','safe','warning','danger')),
    policy_issues        JSONB       NOT NULL DEFAULT '[]',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_user     ON videos (user_id);
CREATE INDEX IF NOT EXISTS idx_videos_product  ON videos (product_id);
CREATE INDEX IF NOT EXISTS idx_videos_public   ON videos (is_public);
CREATE INDEX IF NOT EXISTS idx_videos_created  ON videos (created_at DESC);

-- ============================================================
-- PRODUCT REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id                    SERIAL PRIMARY KEY,
    product_id            INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id               INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id              INTEGER REFERENCES videos(id) ON DELETE SET NULL,
    skin_type             VARCHAR(20),
    usage_duration_weeks  INTEGER,
    purchased_at          VARCHAR(100),
    rating_hydration      SMALLINT CHECK (rating_hydration BETWEEN 1 AND 5),
    rating_texture        SMALLINT CHECK (rating_texture BETWEEN 1 AND 5),
    rating_effectiveness  SMALLINT CHECK (rating_effectiveness BETWEEN 1 AND 5),
    rating_scent          SMALLINT CHECK (rating_scent BETWEEN 1 AND 5),
    rating_value          SMALLINT CHECK (rating_value BETWEEN 1 AND 5),
    overall_rating        DECIMAL(3,2),
    is_suitable           BOOLEAN,
    would_repurchase      BOOLEAN,
    would_recommend       BOOLEAN,
    short_note            VARCHAR(200),
    is_public             BOOLEAN     NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON product_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_public  ON product_reviews (is_public);

-- ============================================================
-- VIDEO ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS video_assets (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id      INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    file_path     TEXT NOT NULL,
    file_size     BIGINT,
    duration      DECIMAL(10,2),
    clip_type     VARCHAR(30)
                      CHECK (clip_type IN ('product_shot','texture','result','unboxing','before_after','other')),
    thumbnail_url TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTENT CALENDAR (keep)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_calendar (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
    script_id          INTEGER REFERENCES scripts(id) ON DELETE CASCADE,
    video_id           INTEGER REFERENCES videos(id) ON DELETE SET NULL,
    scheduled_date     TIMESTAMPTZ NOT NULL,
    time_slot          VARCHAR(50) CHECK (time_slot IN ('morning','afternoon','evening')),
    platform           VARCHAR(50) NOT NULL DEFAULT 'tiktok',
    status             VARCHAR(50) NOT NULL DEFAULT 'planned'
                           CHECK (status IN ('planned','ready','posted','skipped')),
    actual_posted_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_calendar_user   ON content_calendar (user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date   ON content_calendar (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON content_calendar (status);

-- ============================================================
-- ANALYTICS (keep)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    script_id     INTEGER REFERENCES scripts(id) ON DELETE CASCADE,
    video_id      INTEGER REFERENCES videos(id) ON DELETE SET NULL,
    views         INTEGER NOT NULL DEFAULT 0,
    likes         INTEGER NOT NULL DEFAULT 0,
    comments      INTEGER NOT NULL DEFAULT 0,
    shares        INTEGER NOT NULL DEFAULT 0,
    saves         INTEGER NOT NULL DEFAULT 0,
    follower_gain INTEGER NOT NULL DEFAULT 0,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user     ON analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_script   ON analytics (script_id);
CREATE INDEX IF NOT EXISTS idx_analytics_recorded ON analytics (recorded_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id   INTEGER,
    ip_address  VARCHAR(45),
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);

-- ============================================================
-- TOPIC TEMPLATES (keep)
-- ============================================================
CREATE TABLE IF NOT EXISTS topic_templates (
    id                SERIAL PRIMARY KEY,
    topic_name        VARCHAR(255) NOT NULL,
    format_type       VARCHAR(50),
    prompt_template   TEXT,
    example_hook      TEXT,
    example_cta       TEXT,
    performance_score FLOAT NOT NULL DEFAULT 0.0,
    is_active         BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO topic_templates (topic_name, format_type, example_hook, performance_score) VALUES
  ('honest_review',        'text_on_screen', 'Tôi đã dùng thử và đây là sự thật...', 9.2),
  ('ingredient_breakdown', 'voiceover',      'Thành phần này có thể gây hại cho da bạn!', 8.5),
  ('before_after',         'text_on_screen', 'Da tôi sau 30 ngày dùng sản phẩm này...', 9.0),
  ('comparison',           'voiceover',      'Tôi thử 5 sản phẩm và đây là kết quả...', 8.8),
  ('routine_feature',      'text_on_screen', 'Routine giúp da tôi sáng mịn mỗi sáng', 7.5),
  ('red_flag_check',       'voiceover',      'DỪNG LẠI! Đừng dùng sản phẩm này nếu...', 9.5),
  ('dupe_finder',          'text_on_screen', 'Chỉ 200K mà hiệu quả như hàng 2 triệu', 9.3),
  ('community_review',     'voiceover',      '1000 người đã thử và đây là phản hồi...', 8.0)
ON CONFLICT DO NOTHING;

-- Seed brands
INSERT INTO brands (name, slug, description, country_of_origin) VALUES
  ('Some By Mi',   'some-by-mi',   'K-beauty brand nổi tiếng với AHA BHA PHA', 'Hàn Quốc'),
  ('Laneige',      'laneige',      'Premium K-beauty hydration specialist',      'Hàn Quốc'),
  ('The Ordinary', 'the-ordinary', 'Affordable clinical formulations',           'Canada'),
  ('Innisfree',    'innisfree',    'Natural beauty from Jeju Island',            'Hàn Quốc'),
  ('Klairs',       'klairs',       'Gentle skincare for sensitive skin',         'Hàn Quốc'),
  ('Paula''s Choice', 'paulas-choice', 'Research-backed skincare',              'USA')
ON CONFLICT DO NOTHING;
