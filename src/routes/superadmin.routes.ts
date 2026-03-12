import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { isSuperAdmin } from "../middlewares/role.middleware";
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
import { registerAdmin } from "../controllers/auth.controller";
import { getAdminStats, createAdminController, getAllAdminsController, updateAdminController, deleteAdminController } from "../controllers/admin.controller";
import prisma from "../config/prisma";

const router = Router();

// All routes require authentication + SUPERADMIN role
router.use(verifyToken, isSuperAdmin);

// ===== CITY =====

router.post("/cities", createCity);
router.get("/cities", getAllCities);
router.patch("/cities/:id", updateCity);
router.delete("/cities/:id", deleteCity);


// ===== BATCH =====
router.post("/batches", createBatch);
router.get("/batches", getAllBatches);
router.patch("/batches/:id", updateBatch);
router.delete("/batches/:id", deleteBatch);



// ===== ADMIN =====



// ===== ADMIN MANAGEMENT =====
router.post("/admins", createAdminController);                    // Create admin
router.get("/admins", getAllAdminsController);             // Get all admins with filters
router.patch("/admins/:id", updateAdminController);           // Update admin
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