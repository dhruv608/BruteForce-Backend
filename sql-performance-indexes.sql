-- PostgreSQL Indexes for GET /api/student/addedQuestions Query Optimization
-- Goal: Reduce query time from ~900ms to ~300-500ms

-- ============================================================================
-- 1. SINGLE-COLUMN INDEXES (Most Critical)
-- ============================================================================

-- QuestionVisibility table - Primary access patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_visibility_class_id 
ON "QuestionVisibility" (class_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_visibility_question_id 
ON "QuestionVisibility" (question_id);

-- Class table - Filter by batch_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_class_batch_id 
ON "Class" (batch_id);

-- Question table - Join by topic_id and ordering by created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_topic_id 
ON "Question" (topic_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_created_at 
ON "Question" (created_at DESC);

-- Topic table - Join by id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_topic_id 
ON "Topic" (id);

-- StudentProgress table - Filter by student_id + question_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_student_id 
ON "StudentProgress" (student_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_question_id 
ON "StudentProgress" (question_id);

-- Bookmark table - Filter by student_id + question_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmark_student_id 
ON "Bookmark" (student_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmark_question_id 
ON "Bookmark" (question_id);

-- ============================================================================
-- 2. COMPOSITE INDEXES (High Impact for Query Performance)
-- ============================================================================

-- QuestionVisibility: Most common filter pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_visibility_class_question 
ON "QuestionVisibility" (class_id, question_id);

-- StudentProgress: Critical for LEFT JOIN performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_student_question 
ON "StudentProgress" (student_id, question_id);

-- Bookmark: Critical for LEFT JOIN performance  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmark_student_question 
ON "Bookmark" (student_id, question_id);

-- Question: For topic filtering + created_at ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_topic_created_at 
ON "Question" (topic_id, created_at DESC);

-- Class: For batch filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_class_batch_id_id 
ON "Class" (batch_id, id);

-- ============================================================================
-- 3. SPECIALIZED INDEXES for Common Query Variations
-- ============================================================================

-- For search queries (question_name filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_name_gin 
ON "Question" USING gin (question_name gin_trgm_ops);

-- For topic search queries (topic_name filtering)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_topic_name_gin 
ON "Topic" USING gin (topic_name gin_trgm_ops);

-- For level filtering (common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_level 
ON "Question" (level);

-- For platform filtering (common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_platform 
ON "Question" (platform);

-- For type filtering (common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_type 
ON "Question" (type);

-- ============================================================================
-- 4. PARTIAL INDEXES (Optimized for specific conditions)
-- ============================================================================

-- StudentProgress for solved questions only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_solved 
ON "StudentProgress" (student_id, question_id) 
WHERE question_id IS NOT NULL;

-- Bookmark for active bookmarks only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmark_active 
ON "Bookmark" (student_id, question_id) 
WHERE question_id IS NOT NULL;

-- ============================================================================
-- 5. MONITORING & VERIFICATION
-- ============================================================================

-- Query to check index usage after deployment:
-- 
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('QuestionVisibility', 'Question', 'Topic', 'Class', 'StudentProgress', 'Bookmark')
-- ORDER BY idx_scan DESC;

-- Query to analyze query plan before/after:
-- EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
-- SELECT DISTINCT q.id, q.question_name, q.question_link, q.level, q.platform, q.type, q.created_at,
--        t.id as topic_id, t.topic_name, t.slug,
--        CASE WHEN sp.question_id IS NOT NULL THEN true ELSE false END as "isSolved",
--        CASE WHEN b.question_id IS NOT NULL THEN true ELSE false END as "isBookmarked",
--        sp.sync_at
-- FROM "QuestionVisibility" qv
-- JOIN "Class" c ON qv.class_id = c.id
-- JOIN "Question" q ON qv.question_id = q.id
-- JOIN "Topic" t ON q.topic_id = t.id
-- LEFT JOIN "StudentProgress" sp ON q.id = sp.question_id AND sp.student_id = ?
-- LEFT JOIN "Bookmark" b ON q.id = b.question_id AND b.student_id = ?
-- WHERE c.batch_id = ?
-- ORDER BY q.created_at DESC
-- LIMIT ? OFFSET ?;

-- ============================================================================
-- 6. DEPLOYMENT INSTRUCTIONS
-- ============================================================================

-- 1. Run indexes in batches during low traffic periods
-- 2. Use CONCURRENTLY to avoid table locks
-- 3. Monitor performance after each batch
-- 4. Drop unused indexes after 2 weeks if no performance improvement

-- Batch 1 (High Priority):
-- - idx_question_visibility_class_id
-- - idx_question_visibility_class_question  
-- - idx_student_progress_student_question
-- - idx_bookmark_student_question
-- - idx_class_batch_id

-- Batch 2 (Medium Priority):
-- - idx_question_topic_created_at
-- - idx_question_created_at
-- - idx_class_batch_id_id

-- Batch 3 (Low Priority - for search optimization):
-- - idx_question_name_gin (requires pg_trgm extension)
-- - idx_topic_name_gin (requires pg_trgm extension)
-- - idx_question_level, idx_question_platform, idx_question_type

-- Enable pg_trgm extension for text search (run once):
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
