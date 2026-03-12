import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { isSuperAdmin } from "../middlewares/role.middleware";
// City controllers
import { 
  createCity, 
  getAllCities, 
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
import { registerAdmin } from "../controllers/auth.controller";
import { getAdminStats, getAllAdminsController, updateAdminController, deleteAdminController } from "../controllers/admin.controller";
import { createSuperAdminController, updateSuperAdminController } from "../controllers/superadmin.controller";
import prisma from "../config/prisma";

const router = Router();

// All routes require authentication + SUPERADMIN role
router.use(verifyToken, isSuperAdmin);

// ===== CITY =====

router.post("/cities", createCity);
router.get("/cities", getAllCities);
router.delete("/cities/:id", deleteCity);


// ===== BATCH =====
router.post("/batches", createBatch);
router.patch("/batches/:id", updateBatch);
router.delete("/batches/:id", deleteBatch);



// ===== ADMIN MANAGEMENT =====
router.post("/admins", createSuperAdminController);                    // Create admin (SuperAdmin - auto fetch city_id from batch)
router.get("/admins", getAllAdminsController);             // Get all admins with filters
router.patch("/admins/:id", updateSuperAdminController);           // Update admin (SuperAdmin - only role & batch_id allowed)
router.delete("/admins/:id", deleteAdminController);         // Delete admin



// ===== SYSTEM STATS =====
router.get("/stats", async (req, res) => {
  try {
    const [
      totalCities,
      totalBatches,
      totalStudents,
      totalAdmins,
      totalQuestions,
      totalTopics
    ] = await Promise.all([
      prisma.city.count(),
      prisma.batch.count(),
      prisma.student.count(),
      (prisma as any).admin.count(),
      prisma.question.count(),
      prisma.topic.count()
    ]);

    res.json({
      stats: {
        totalCities,
        totalBatches,
        totalStudents,
        totalAdmins,
        totalQuestions,
        totalTopics
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;