"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminController = exports.updateAdminController = exports.getAllAdminsController = exports.createAdminController = exports.getAdminStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const admin_service_1 = require("../services/admin.service");
const admin_service_2 = require("../services/admin.service");
const getAdminStats = async (req, res) => {
    try {
        // Get total counts
        const [totalCities, totalBatches, totalStudents, totalAdmins] = await Promise.all([
            prisma_1.default.city.count(),
            prisma_1.default.batch.count(),
            prisma_1.default.student.count(),
            prisma_1.default.admin.count({
                where: { role: 'TEACHER' }
            })
        ]);
        // Get city-wise distribution
        const cityWiseDistribution = await (0, admin_service_1.getCityWiseStats)();
        return res.status(200).json({
            success: true,
            data: {
                totalCities,
                totalBatches,
                totalAdmins,
                totalStudents,
                cityWiseDistribution
            }
        });
    }
    catch (error) {
        console.error("Admin stats error:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch admin statistics"
        });
    }
};
exports.getAdminStats = getAdminStats;
const createAdminController = async (req, res) => {
    try {
        const adminData = req.body;
        // Validate required fields (removed username)
        if (!adminData.name || !adminData.email || !adminData.password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, email, password"
            });
        }
        const newAdmin = await (0, admin_service_2.createAdminService)(adminData);
        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: newAdmin
        });
    }
    catch (error) {
        console.error("Create admin error:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to create admin"
        });
    }
};
exports.createAdminController = createAdminController;
const getAllAdminsController = async (req, res) => {
    try {
        const filters = req.query;
        const admins = await (0, admin_service_2.getAllAdminsService)(filters);
        return res.status(200).json({
            success: true,
            data: admins
        });
    }
    catch (error) {
        console.error("Get admins error:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch admins"
        });
    }
};
exports.getAllAdminsController = getAllAdminsController;
const updateAdminController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid admin ID is required"
            });
        }
        const updatedAdmin = await (0, admin_service_2.updateAdminService)(parseInt(id), updateData);
        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin
        });
    }
    catch (error) {
        console.error("Update admin error:", error);
        const statusCode = error.message === 'Admin not found' ? 404 : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to update admin"
        });
    }
};
exports.updateAdminController = updateAdminController;
const deleteAdminController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid admin ID is required"
            });
        }
        const result = await (0, admin_service_2.deleteAdminService)(parseInt(id));
        return res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        console.error("Delete admin error:", error);
        const statusCode = error.message === 'Admin not found' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to delete admin"
        });
    }
};
exports.deleteAdminController = deleteAdminController;
