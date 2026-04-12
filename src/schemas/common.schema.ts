import { z } from "zod";

/**
 * Pagination Query Schema
 * Shared across all list endpoints
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = val ? Number(val) : 10;
      return Math.min(num, 100); // Max 100 per page
    }),
  search: z.string().optional(),
});

/**
 * Generic ID Param Schema
 */
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

/**
 * Email Schema (reusable)
 */
export const emailSchema = z.string().email("Invalid email format");

/**
 * Password Schema (reusable)
 */
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

/**
 * Optional ID Query Param
 * For filtering by related entity ID
 */
export const optionalIdQuerySchema = z.object({
  id: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
});

// Type exports
type PaginationQuery = z.infer<typeof paginationQuerySchema>;
type IdParam = z.infer<typeof idParamSchema>;
