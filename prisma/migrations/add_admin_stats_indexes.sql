-- Migration: Add admin stats API performance indexes
-- For optimized POST /api/admin/stats queries
-- Run: npx prisma db execute --file prisma/migrations/add_admin_stats_indexes.sql

-- =============================================================================
-- CRITICAL: For QuestionVisibility JOIN with Class in admin stats
-- Query: JOIN "Class" c ON qv.class_id = c.id WHERE c.batch_id = ${batchId}
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_visibility_class_id 
ON "QuestionVisibility" (class_id);

-- =============================================================================
-- NOTE: The following indexes should already exist from previous migrations:
-- - idx_class_batch_id on "Class"(batch_id) - for batch filtering
-- - "Class" has @@index([batch_id]) in schema
-- - "Student" has @@index([batch_id]) in schema
-- =============================================================================

-- =============================================================================
-- VERIFY: Check if indexes were created successfully
-- =============================================================================
-- \di "idx_question_visibility_class_id"
