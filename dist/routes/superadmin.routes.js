"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const admin_middleware_1 = require("../middlewares/admin.middleware");
// City controllers
const city_controller_1 = require("../controllers/city.controller");
// Batch controllers
const batch_controller_1 = require("../controllers/batch.controller");
// Admin management
const admin_controller_1 = require("../controllers/admin.controller");
const superadminStats_controller_1 = require("../controllers/superadminStats.controller");
const router = (0, express_1.Router)();
// All routes require authentication + SUPERADMIN role
router.use(auth_middleware_1.verifyToken, role_middleware_1.isSuperAdmin, admin_middleware_1.extractAdminInfo);
// Current SuperAdmin Info
router.get("/me", superadminStats_controller_1.getCurrentSuperAdminController);
// ===== CITY =====
router.post("/cities", city_controller_1.createCity);
router.get("/cities", city_controller_1.getAllCities);
router.patch("/cities/:id", city_controller_1.updateCity);
router.delete("/cities/:id", city_controller_1.deleteCity);
// ===== BATCH =====
router.get("/batches", batch_controller_1.getAllBatches);
router.post("/batches", batch_controller_1.createBatch);
router.patch("/batches/:id", batch_controller_1.updateBatch);
router.delete("/batches/:id", batch_controller_1.deleteBatch);
// ===== ADMIN MANAGEMENT =====
router.post("/admins", admin_controller_1.createAdminController); // Create admin (SuperAdmin - auto fetch city_id from batch)
router.get("/admins", admin_controller_1.getAllAdminsController); // Get all admins with filters
router.patch("/admins/:id", admin_controller_1.updateAdminController); // Update admin (SuperAdmin - only role & batch_id allowed)
router.delete("/admins/:id", admin_controller_1.deleteAdminController); // Delete admin
// ===== SYSTEM STATS =====
router.get("/stats", superadminStats_controller_1.getSuperAdminStats); // Get system-wide statistics                // Get batch-specific admin statistics
exports.default = router;
