"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminLeaderboard = getAdminLeaderboard;
const prisma_1 = __importDefault(require("../../config/prisma"));
const leaderboard_shared_1 = require("./leaderboard.shared");
/**
 * Get admin leaderboard with pagination
 */
async function getAdminLeaderboard(filters, pagination, search) {
    try {
        // Prepare effective filters
        const effectiveFilters = {
            city: filters.city || "all",
            year: filters.year || new Date().getFullYear(),
            search,
        };
        // Build base query
        const { whereClause, orderByClause, params, nextParamIndex } = (0, leaderboard_shared_1.buildLeaderboardBaseQuery)(effectiveFilters);
        const selectClause = (0, leaderboard_shared_1.buildSelectClause)();
        const fromClause = (0, leaderboard_shared_1.buildFromClause)();
        // Build count query - optimized to start from Leaderboard
        const countQuery = `
      SELECT COUNT(*) as total
      FROM "Leaderboard" l
      JOIN "Student" s ON s.id = l.student_id
      JOIN "Batch" b ON b.id = s.batch_id
      JOIN "City" c ON c.id = s.city_id
      ${whereClause}
    `;
        // Build paginated data query
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;
        const dataQuery = `
      ${selectClause}
      ${fromClause}
      ${whereClause}
      ${orderByClause}
      LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}
    `;
        // Execute count and data queries in parallel
        const [countResult, leaderboardData] = await Promise.all([
            prisma_1.default.$queryRawUnsafe(countQuery, ...params),
            prisma_1.default.$queryRawUnsafe(dataQuery, ...params, limit, offset),
        ]);
        const total = Number(countResult[0]?.total || 0);
        const leaderboard = leaderboardData.map(leaderboard_shared_1.normalizeLeaderboardRow);
        // Get metadata (cached) in parallel
        const [availableCities, lastCalculated] = await Promise.all([
            (0, leaderboard_shared_1.getCachedCityYearMapping)(),
            Promise.resolve(leaderboard[0]?.last_calculated || new Date().toISOString()),
        ]);
        return {
            leaderboard,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            available_cities: availableCities,
            last_calculated: lastCalculated,
        };
    }
    catch (error) {
        (0, leaderboard_shared_1.handleLeaderboardError)(error, "Admin leaderboard");
    }
}
