"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSuperAdminService = exports.getSuperAdminStatsService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
const getSuperAdminStatsService = async () => {
    try {
        const [totalCities, totalBatches, totalAdmins,] = await Promise.all([
            prisma_1.default.city.count(),
            prisma_1.default.batch.count(),
            prisma_1.default.admin.count({
                where: {
                    role: 'TEACHER'
                }
            }),
        ]);
        return {
            totalCities,
            totalBatches,
            totalAdmins,
        };
    }
    catch (error) {
        console.error("System stats error:", error);
        throw new ApiError_1.ApiError(400, "Failed to fetch system statistics");
    }
};
exports.getSuperAdminStatsService = getSuperAdminStatsService;
const getCurrentSuperAdminService = async (adminId) => {
    const superadmin = await prisma_1.default.admin.findUnique({
        where: { id: adminId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });
    if (!superadmin) {
        throw new ApiError_1.ApiError(404, "SuperAdmin not found");
    }
    return superadmin;
};
exports.getCurrentSuperAdminService = getCurrentSuperAdminService;
