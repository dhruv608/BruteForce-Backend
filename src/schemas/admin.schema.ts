import { z } from "zod";

/**
 * Create Admin Schema
 * POST /api/admin (or via superadmin)
 */
export const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPERADMIN", "TEACHER", "INTERN"], {
    message: "Role must be SUPERADMIN, TEACHER, or INTERN",
  }),
  city_id: z.number().int().positive().optional(),
  batch_id: z.number().int().positive().optional(),
});

/**
 * Update Admin Schema
 * PATCH /api/admin/:id
 */
export const updateAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["SUPERADMIN", "TEACHER", "INTERN"]).optional(),
});

/**
 * Admin ID Param Schema
 */
export const adminIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

/**
 * Batch Stats Request Schema
 * POST /api/admin/stats
 */
export const batchStatsSchema = z.object({
  batch_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
});

/**
 * Admin Query Schema
 * GET /api/admin
 */
export const adminQuerySchema = z.object({
  role: z.enum(["SUPERADMIN", "TEACHER", "INTERN"]).optional().default("TEACHER"),
  page: z.string().optional().transform((val) => val ? Number(val) : 1),
  limit: z.string().optional().transform((val) => val ? Number(val) : 10),
  search: z.string().optional(),
});

// Type exports
type CreateAdminInput = z.infer<typeof createAdminSchema>;
type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
