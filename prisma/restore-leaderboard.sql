-- 🚀 Restore Leaderboard Data After Migration
-- Run this in your database to recreate leaderboard entries

-- First, ensure all students have leaderboard entries
INSERT INTO "Leaderboard" (
    student_id, 
    max_streak, 
    easy_count, 
    medium_count, 
    hard_count, 
    total_solved,
    last_calculated
)
SELECT 
    s.id,
    0,
    0,
    0,
    0,
    0,
    NOW()
FROM "Student" s
LEFT JOIN "Leaderboard" l ON l.student_id = s.id
WHERE l.id IS NULL;

-- Update with actual progress data
UPDATE "Leaderboard" l
SET 
    easy_count = COALESCE(progress_counts.easy, 0),
    medium_count = COALESCE(progress_counts.medium, 0),
    hard_count = COALESCE(progress_counts.hard, 0),
    total_solved = COALESCE(progress_counts.total, 0),
    last_calculated = NOW()
FROM (
    SELECT 
        sp.student_id,
        COUNT(*) FILTER (WHERE q.level = 'EASY') as easy,
        COUNT(*) FILTER (WHERE q.level = 'MEDIUM') as medium,
        COUNT(*) FILTER (WHERE q.level = 'HARD') as hard,
        COUNT(*) as total
    FROM "StudentProgress" sp
    JOIN "Question" q ON q.id = sp.question_id
    GROUP BY sp.student_id
) AS progress_counts
WHERE l.student_id = progress_counts.student_id;

-- Verify restoration
SELECT 
    'Restored ' || COUNT(*) || ' leaderboard entries' as status
FROM "Leaderboard";
