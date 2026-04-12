import { z } from "zod";

/**
 * Platform enum
 */
export const PlatformEnum = z.enum(["LEETCODE", "GFG", "INTERVIEWBIT", "OTHER"]);

/**
 * Level enum
 */
export const LevelEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

/**
 * Create Question Schema
 * POST /api/admin/questions
 */
export const createQuestionSchema = z.object({
  question_name: z.string().min(1, "Question name is required"),
  question_link: z.string().url("Question link must be a valid URL"),
  topic_id: z.number().int().positive("Topic ID is required"),
  platform: PlatformEnum.optional(),
  level: LevelEnum.optional().default("EASY"),
});

/**
 * Update Question Schema
 * PATCH /api/admin/questions/:id
 */
export const updateQuestionSchema = z.object({
  question_name: z.string().min(1, "Question name is required").optional(),
  question_link: z.string().url("Question link must be a valid URL").optional(),
  topic_id: z.number().int().positive().optional(),
  platform: PlatformEnum.optional(),
  level: LevelEnum.optional(),
});

/**
 * Question ID Param Schema
 */
export const questionIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

/**
 * Question Query/Filters Schema
 * GET /api/admin/questions or GET /api/students/addedQuestions
 */
export const questionQuerySchema = z.object({
  topicSlug: z.string().optional(),
  level: LevelEnum.optional(),
  platform: PlatformEnum.optional(),
  search: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? Number(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? Number(val) : 10)),
});

// Type exports
type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
