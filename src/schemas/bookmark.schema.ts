import { z } from "zod";

/**
 * Create Bookmark Schema
 * POST /api/students/bookmarks
 */
export const createBookmarkSchema = z.object({
  question_id: z.number().int().positive("Question ID is required"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});

/**
 * Update Bookmark Schema
 * PUT /api/students/bookmarks/:questionId
 */
export const updateBookmarkSchema = z.object({
  description: z.string().max(500, "Description must be 500 characters or less"),
});

/**
 * Bookmark Query Params Schema
 * GET /api/students/bookmarks
 */
export const bookmarkQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sort: z.enum(["recent", "old", "solved", "unsolved"]).optional().default("recent"),
  filter: z.enum(["all", "solved", "unsolved"]).optional().default("all"),
});

/**
 * Question ID Param Schema (for bookmark routes)
 */
export const bookmarkQuestionIdParamSchema = z.object({
  questionId: z.string().regex(/^\d+$/, "Question ID must be a number").transform(Number),
});

// Type exports
type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
