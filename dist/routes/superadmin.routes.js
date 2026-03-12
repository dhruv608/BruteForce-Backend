"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
// City controllers
const city_controller_1 = require("../controllers/city.controller");
// Batch controllers
const batch_controller_1 = require("../controllers/batch.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const superadmin_controller_1 = require("../controllers/superadmin.controller");
const prisma_1 = __importDefault(require("../config/prisma"));
const router = (0, express_1.Router)();
// All routes require authentication + SUPERADMIN role
router.use(auth_middleware_1.verifyToken, role_middleware_1.isSuperAdmin);
// ===== CITY =====
router.post("/cities", city_controller_1.createCity);
router.get("/cities", city_controller_1.getAllCities);
router.delete("/cities/:id", city_controller_1.deleteCity);
// ===== BATCH =====
router.get("/batches", batch_controller_1.getAllBatches);
router.post("/batches", batch_controller_1.createBatch);
router.patch("/batches/:id", batch_controller_1.updateBatch);
router.delete("/batches/:id", batch_controller_1.deleteBatch);
// ===== ADMIN =====
// ===== ADMIN MANAGEMENT =====
router.post("/admins", superadmin_controller_1.createSuperAdminController); // Create admin (SuperAdmin - auto fetch city_id from batch)
router.get("/admins", admin_controller_1.getAllAdminsController); // Get all admins with filters
router.patch("/admins/:id", superadmin_controller_1.updateSuperAdminController); // Update admin (SuperAdmin - only role & batch_id allowed)
router.delete("/admins/:id", admin_controller_1.deleteAdminController); // Delete admin
// ===== SYSTEM STATS =====
router.get("/stats", async (req, res) => {
    try {
        const [totalCities, totalBatches, totalStudents, totalAdmins, totalQuestions, totalTopics] = await Promise.all([
            prisma_1.default.city.count(),
            prisma_1.default.batch.count(),
            prisma_1.default.student.count(),
            prisma_1.default.admin.count(),
            prisma_1.default.question.count(),
            prisma_1.default.topic.count()
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
exports.default = router;
