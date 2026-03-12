-- Create optimized leaderboard cache table
CREATE TABLE IF NOT EXISTS "LeaderboardCache" (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    global_rank INTEGER NOT NULL,
    city_rank INTEGER NOT NULL,
    score DECIMAL(10,2) NOT NULL,
    hard_completion DECIMAL(5,2) DEFAULT 0,
    medium_completion DECIMAL(5,2) DEFAULT 0,
    easy_completion DECIMAL(5,2) DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    total_solved INTEGER DEFAULT 0,
    hard_solved INTEGER DEFAULT 0,
    medium_solved INTEGER DEFAULT 0,
    easy_solved INTEGER DEFAULT 0,
    city_name VARCHAR(100),
    batch_year INTEGER,
    filters_hash VARCHAR(64) NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    
    -- Optimized indexes
    CONSTRAINT unique_student_filters UNIQUE(student_id, filters_hash)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_global_rank ON "LeaderboardCache" (global_rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_city_rank ON "LeaderboardCache" (city_name, city_rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_score ON "LeaderboardCache" (score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_filters_hash ON "LeaderboardCache" (filters_hash);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_student_filters ON "LeaderboardCache" (student_id, filters_hash);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_last_updated ON "LeaderboardCache" (last_updated);

-- Add comments for documentation
COMMENT ON TABLE "LeaderboardCache" IS 'Optimized cache table for pre-calculated leaderboard data';
COMMENT ON COLUMN "LeaderboardCache".filters_hash IS 'MD5 hash of filter combination (city-year-type)';
COMMENT ON COLUMN "LeaderboardCache".last_updated IS 'When this cache entry was last synchronized';
