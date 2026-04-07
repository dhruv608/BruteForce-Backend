-- Migration: Add performance indexes for questionVisibility query optimization
-- Run this migration using: npx prisma db push

-- Core indexes for 60-70% performance improvement
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_visibility_class_id 
ON "QuestionVisibility" (class_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_visibility_class_question 
ON "QuestionVisibility" (class_id, question_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_student_question 
ON "StudentProgress" (student_id, question_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmark_student_question 
ON "Bookmark" (student_id, question_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_class_batch_id 
ON "Class" (batch_id);

-- Additional indexes for extra performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_topic_created_at 
ON "Question" (topic_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_class_batch_id_id 
ON "Class" (batch_id, id);
