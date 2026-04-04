"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuperAdminStats = exports.getCurrentSuperAdminController = void 0;
const superadminStats_service_1 = require("../services/superadminStats.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.getCurrentSuperAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get superadmin info from middleware (extracted from token)
        const superadminInfo = req.admin;
        if (!superadminInfo) {
            return res.status(401).json({
                success: false,
                message: "SuperAdmin not authenticated"
            });
        }
        const superadmin = await (0, superadminStats_service_1.getCurrentSuperAdminService)(superadminInfo.id);
        return res.status(200).json({
            success: true,
            data: {
                id: superadmin.id,
                name: superadmin.name,
                email: superadmin.email,
                role: superadmin.role
            }
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch current superadmin"
        });
    }
});
exports.getSuperAdminStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const stats = await (0, superadminStats_service_1.getSuperAdminStatsService)();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        console.error("System stats controller error:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch system statistics"
        });
    }
});
