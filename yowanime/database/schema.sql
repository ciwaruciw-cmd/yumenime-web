-- ============================================================
-- YOWANIME PostgreSQL Database Schema
-- Compatible with PostgreSQL 12+
-- ============================================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS video_sources CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS anime_genres CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS animes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ANIMES TABLE
CREATE TABLE animes (
    id VARCHAR(64) PRIMARY KEY,
    mal_id INT UNIQUE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_english VARCHAR(255),
    title_japanese VARCHAR(255),
    synopsis TEXT,
    synopsis_short TEXT,
    poster TEXT NOT NULL,
    banner TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- ongoing, completed, upcoming
    type VARCHAR(20) DEFAULT 'TV',           -- TV, Movie, OVA, ONA, Special
    year INT DEFAULT 2024,
    season VARCHAR(20) DEFAULT 'Spring',     -- Winter, Spring, Summer, Fall
    studio VARCHAR(100),
    rating VARCHAR(20) DEFAULT 'PG-13',
    score NUMERIC(3,2) DEFAULT 7.50,
    episodes INT DEFAULT 12,
    duration INT DEFAULT 24,                 -- in minutes
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_new_update BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. GENRES TABLE
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 4. ANIME_GENRES JUNCTION TABLE
CREATE TABLE anime_genres (
    anime_id VARCHAR(64) REFERENCES animes(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);

-- 5. EPISODES TABLE
CREATE TABLE episodes (
    id VARCHAR(64) PRIMARY KEY,
    anime_id VARCHAR(64) REFERENCES animes(id) ON DELETE CASCADE,
    episode_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    thumbnail TEXT,
    duration INT DEFAULT 1440, -- in seconds
    aired_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. VIDEO_SOURCES TABLE
CREATE TABLE video_sources (
    id SERIAL PRIMARY KEY,
    episode_id VARCHAR(64) REFERENCES episodes(id) ON DELETE CASCADE,
    quality VARCHAR(20) NOT NULL, -- 1080p, 720p, 480p
    url TEXT NOT NULL
);

-- 7. WATCHLISTS TABLE
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    anime_id VARCHAR(64) REFERENCES animes(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'watching', -- watching, completed, plan_to_watch, dropped
    current_episode INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, anime_id)
);

-- 8. COMMENTS TABLE
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    anime_id VARCHAR(64) REFERENCES animes(id) ON DELETE CASCADE,
    episode_id VARCHAR(64) REFERENCES episodes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(20) DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR HIGH PERFORMANCE QUERIES
-- ============================================================
CREATE INDEX idx_animes_slug ON animes(slug);
CREATE INDEX idx_animes_score ON animes(score DESC);
CREATE INDEX idx_animes_type ON animes(type);
CREATE INDEX idx_animes_status ON animes(status);
CREATE INDEX idx_animes_year ON animes(year);
CREATE INDEX idx_animes_trending ON animes(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_animes_featured ON animes(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_episodes_anime ON episodes(anime_id, episode_number);
