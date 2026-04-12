import { z } from "zod";

/**
 * Create City Schema
 * POST /api/superadmin/cities
 */
export const createCitySchema = z.object({
  city_name: z.string().min(1, "City name is required"),
});

/**
 * Update City Schema
 * PUT /api/superadmin/cities/:id
 */
export const updateCitySchema = z.object({
  city_name: z.string().min(1, "City name is required"),
});

/**
 * Create Batch Schema
 * POST /api/superadmin/batches
 */
export const createBatchSchema = z.object({
  batch_name: z.string().min(1, "Batch name is required"),
  year: z.number().int().min(2000).max(2100),
  city_id: z.number().int().positive("City ID is required"),
});

/**
 * Update Batch Schema
 * PUT /api/superadmin/batches/:id
 */
export const updateBatchSchema = z.object({
  batch_name: z.string().min(1, "Batch name is required").optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  city_id: z.number().int().positive().optional(),
});

/**
 * City ID Param Schema
 */
export const cityIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

/**
 * Batch ID Param Schema
 */
export const batchIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

// Type exports
type CreateCityInput = z.infer<typeof createCitySchema>;
type UpdateCityInput = z.infer<typeof updateCitySchema>;
type CreateBatchInput = z.infer<typeof createBatchSchema>;
type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
