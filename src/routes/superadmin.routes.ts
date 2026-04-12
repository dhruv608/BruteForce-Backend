import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { isSuperAdmin } from "../middlewares/role.middleware";
import { extractAdminInfo } from "../middlewares/admin.middleware";
import { validateBody, validateParams } from "../middlewares/validate.middleware";
import {
  createCitySchema,
  updateCitySchema,
  createBatchSchema,
  updateBatchSchema,
  cityIdParamSchema,
  batchIdParamSchema,
} from "../schemas/superadmin.schema";
import {
  createAdminSchema,
  updateAdminSchema,
  adminIdParamSchema,
} from "../schemas/admin.schema";
// City controllers
import { 
  createCity, 
  getAllCities, 
  updateCity,
  deleteCity
} from "../controllers/city.controller";

// Batch controllers
import { 
  createBatch,
  deleteBatch,
  getAllBatches,
  updateBatch, 
} from "../controllers/batch.controller";

// Admin management
import { getAllAdminsController, updateAdminController, deleteAdminController, createAdminController } from "../controllers/admin.controller";
import { getSuperAdminStats, getCurrentSuperAdminController } from "../controllers/superadminStats.controller";

const router = Router();

// All routes require authentication + SUPERADMIN role
router.use(verifyToken, isSuperAdmin, extractAdminInfo);

// Current SuperAdmin Info
router.get("/me", getCurrentSuperAdminController);

// ===== CITY =====
router.post("/cities", validateBody(createCitySchema), createCity);
router.get("/cities", getAllCities);
router.patch("/cities/:id", validateParams(cityIdParamSchema), validateBody(updateCitySchema), updateCity);
router.delete("/cities/:id", validateParams(cityIdParamSchema), deleteCity);

// ===== BATCH =====
router.get("/batches", getAllBatches);
router.post("/batches", validateBody(createBatchSchema), createBatch);
router.patch("/batches/:id", validateParams(batchIdParamSchema), validateBody(updateBatchSchema), updateBatch);
router.delete("/batches/:id", validateParams(batchIdParamSchema), deleteBatch);

// ===== ADMIN MANAGEMENT =====
router.post("/admins", validateBody(createAdminSchema), createAdminController);
router.get("/admins", getAllAdminsController);
router.patch("/admins/:id", validateParams(adminIdParamSchema), validateBody(updateAdminSchema), updateAdminController);
router.delete("/admins/:id", validateParams(adminIdParamSchema), deleteAdminController);

// ===== SYSTEM STATS =====
router.get("/stats", getSuperAdminStats);                       // Get system-wide statistics                // Get batch-specific admin statistics

export default router;