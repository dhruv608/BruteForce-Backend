-- Add composite indexes for leaderboard performance optimization

-- Composite index on Leaderboard table for efficient ranking queries
CREATE INDEX idx_leaderboard_composite ON "Leaderboard" (student_id, alltime_global_rank, alltime_city_rank);

-- Composite index on Student table for efficient batch and city filtering
CREATE INDEX idx_student_batch_city ON "Student" (batch_id, city_id);
