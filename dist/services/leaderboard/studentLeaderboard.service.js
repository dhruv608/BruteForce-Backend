"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentLeaderboard = getStudentLeaderboard;
const prisma_1 = __importDefault(require("../../config/prisma"));
const leaderboard_shared_1 = require("./leaderboard.shared");
/**
 * Get student leaderboard with top 10 and personal rank
 * Uses JWT data to avoid extra Prisma queries
 */
async function getStudentLeaderboard(jwtData, filters, search) {
    try {
        // Extract JWT data
        const { studentId, cityId, batchYear } = jwtData;
        // Determine effective filters
        const effectiveYear = filters.year || batchYear || new Date().getFullYear();
        // Look up city ID from city name when a specific city is selected
        let effectiveCityId = undefined;
        if (filters.city && filters.city !== "all") {
            const cityRecord = await prisma_1.default.city.findFirst({
                where: { city_name: filters.city },
                select: { id: true }
            });
            if (cityRecord) {
                effectiveCityId = cityRecord.id;
            }
        }
        // Build base query using city_id (integer comparison - much faster)
        const { whereClause, orderByClause, params } = (0, leaderboard_shared_1.buildLeaderboardBaseQueryByCityId)(effectiveYear, effectiveCityId, search);
        // Execute Top 10 query
        const selectClause = (0, leaderboard_shared_1.buildSelectClause)();
        const fromClause = (0, leaderboard_shared_1.buildFromClause)();
        const top10Query = `
      ${selectClause}
      ${fromClause}
      ${whereClause}
      ${orderByClause}
      LIMIT $${params.length + 1}
    `;
        const top10Data = await prisma_1.default.$queryRawUnsafe(top10Query, ...params, 10);
        const top10 = top10Data.map(leaderboard_shared_1.normalizeLeaderboardRow);
        // Execute "Your Rank" query using city_id filter
        const yourRankQuery = `
      SELECT 
        l.alltime_global_rank as global_rank,
        l.alltime_city_rank as city_rank,
        s.name,
        s.username,
        s.profile_image_url,
        c.city_name,
        b.year as batch_year,
        l.hard_solved,
        l.medium_solved,
        l.easy_solved,
        l.max_streak,
        l.hard_solved + l.medium_solved + l.easy_solved AS total_solved,
        b.hard_assigned,
        b.medium_assigned,
        b.easy_assigned,
        ROUND(
          (l.hard_solved::numeric / NULLIF(b.hard_assigned, 0) * 2000) +
          (l.medium_solved::numeric / NULLIF(b.medium_assigned, 0) * 1500) +
          (l.easy_solved::numeric / NULLIF(b.easy_assigned, 0) * 1000), 2
        ) AS score
      FROM "Leaderboard" l
      JOIN "Student" s ON s.id = l.student_id
      JOIN "Batch" b ON b.id = s.batch_id
      JOIN "City" c ON c.id = s.city_id
      WHERE l.student_id = $1 AND b.year = $2
        ${effectiveCityId ? `AND s.city_id = $3` : ""}
    `;
        const yourRankParams = [studentId, effectiveYear];
        if (effectiveCityId) {
            yourRankParams.push(effectiveCityId);
        }
        const yourRankData = await prisma_1.default.$queryRawUnsafe(yourRankQuery, ...yourRankParams);
        const yourRankRaw = yourRankData[0] || null;
        // Check if student exists and prepare response
        if (!yourRankRaw) {
            return {
                top10,
                yourRank: null,
                message: "Student rank not found in current filters",
                filters: {
                    city: filters.city || "all",
                    year: effectiveYear,
                },
                available_cities: await (0, leaderboard_shared_1.getCachedCityYearMapping)(),
                last_calculated: top10[0]?.last_calculated || new Date().toISOString(),
            };
        }
        // Prepare your rank response using data from JOIN
        const isGlobalView = !effectiveCityId;
        const yourRank = {
            rank: isGlobalView ? yourRankRaw.global_rank : yourRankRaw.city_rank,
            student_id: studentId,
            name: yourRankRaw.name,
            username: yourRankRaw.username,
            profile_image_url: yourRankRaw.profile_image_url,
            batch_year: yourRankRaw.batch_year || null,
            city_name: yourRankRaw.city_name,
            max_streak: Number(yourRankRaw.max_streak) || 0,
            score: Number(yourRankRaw.score) || 0,
            easy_solved: Number(yourRankRaw.easy_solved) || 0,
            medium_solved: Number(yourRankRaw.medium_solved) || 0,
            hard_solved: Number(yourRankRaw.hard_solved) || 0,
            total_solved: Number(yourRankRaw.total_solved) || 0,
            total_assigned: (Number(yourRankRaw.hard_assigned) || 0) +
                (Number(yourRankRaw.medium_assigned) || 0) +
                (Number(yourRankRaw.easy_assigned) || 0),
        };
        // Get metadata (cached)
        const [availableCities, lastCalculated] = await Promise.all([
            (0, leaderboard_shared_1.getCachedCityYearMapping)(),
            Promise.resolve(top10[0]?.last_calculated || new Date().toISOString()),
        ]);
        return {
            top10,
            yourRank,
            message: null,
            filters: {
                city: filters.city || "all",
                year: effectiveYear,
            },
            available_cities: availableCities,
            last_calculated: lastCalculated,
        };
    }
    catch (error) {
        (0, leaderboard_shared_1.handleLeaderboardError)(error, "Student leaderboard");
    }
}
