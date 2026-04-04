"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolesController = exports.deleteAdminController = exports.updateAdminController = exports.getAllAdminsController = exports.createAdminController = exports.getAdminStats = exports.getCurrentAdminController = void 0;
const client_1 = require("@prisma/client");
const admin_service_1 = require("../services/admin.service");
const admin_service_2 = require("../services/admin.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.getCurrentAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get admin info from middleware (extracted from token)
        const adminInfo = req.admin;
        if (!adminInfo) {
            throw new ApiError_1.ApiError(401, "Admin not authenticated", [], "AUTH_ERROR");
        }
        const admin = await (0, admin_service_1.getCurrentAdminService)(adminInfo.id);
        return res.status(200).json({
            success: true,
            data: admin
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch current admin", [], "INTERNAL_SERVER_ERROR");
    }
});
exports.getAdminStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { batch_id } = req.body;
        // Validate batch_id
        if (!batch_id || isNaN(parseInt(batch_id))) {
            throw new ApiError_1.ApiError(400, "Valid batch_id is required", [], "VALIDATION_ERROR");
        }
        const batchId = parseInt(batch_id);
        const stats = await (0, admin_service_1.getAdminStatsService)(batchId);
        return res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch batch statistics", [], "SERVER_ERROR");
    }
});
exports.createAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const adminData = req.body;
        // Validate required fields (removed username)
        if (!adminData.name || !adminData.email || !adminData.password) {
            throw new ApiError_1.ApiError(400, "Missing required fields: name, email, password", [], "VALIDATION_ERROR");
        }
        const newAdmin = await (0, admin_service_2.createAdminService)(adminData);
        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: newAdmin
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, "Failed to create admin", [], "ADMIN_CREATE_ERROR");
    }
});
exports.getAllAdminsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const filters = req.query;
        // Default to TEACHER role if no role filter is provided (SuperAdmin context)
        if (!filters.role) {
            filters.role = 'TEACHER';
        }
        const admins = await (0, admin_service_2.getAllAdminsService)(filters);
        return res.status(200).json({
            success: true,
            data: admins
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch admins", [], "SERVER_ERROR");
    }
});
exports.updateAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id || isNaN(parseInt(id))) {
            throw new ApiError_1.ApiError(400, "Valid admin ID is required", [], "VALIDATION_ERROR");
        }
        const updatedAdmin = await (0, admin_service_2.updateAdminService)(parseInt(id), updateData);
        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        const statusCode = error.message === 'Admin not found' ? 404 : 400;
        const errorCode = error.message === 'Admin not found' ? 'ADMIN_NOT_FOUND' : 'ADMIN_UPDATE_ERROR';
        throw new ApiError_1.ApiError(statusCode, error.message || "Failed to update admin", [], errorCode);
    }
});
exports.deleteAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            throw new ApiError_1.ApiError(400, "Valid admin ID is required", [], "VALIDATION_ERROR");
        }
        const result = await (0, admin_service_2.deleteAdminService)(parseInt(id));
        return res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        const statusCode = error.message === 'Admin not found' ? 404 : 500;
        const errorCode = error.message === 'Admin not found' ? 'ADMIN_NOT_FOUND' : 'ADMIN_DELETE_ERROR';
        throw new ApiError_1.ApiError(statusCode, error.message || "Failed to delete admin", [], errorCode);
    }
});
exports.getRolesController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const roles = Object.values(client_1.AdminRole);
        return res.status(200).json({
            success: true,
            data: roles
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch roles", [], "SERVER_ERROR");
    }
});
