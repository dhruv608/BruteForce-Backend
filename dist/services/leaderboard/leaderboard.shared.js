"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLeaderboardBaseQueryByCityId = buildLeaderboardBaseQueryByCityId;
exports.buildLeaderboardBaseQuery = buildLeaderboardBaseQuery;
exports.getCachedYears = getCachedYears;
exports.getCachedCityYearMapping = getCachedCityYearMapping;
exports.getAvailableYears = getAvailableYears;
exports.clearMetadataCache = clearMetadataCache;
exports.buildSelectClause = buildSelectClause;
exports.buildFromClause = buildFromClause;
exports.normalizeLeaderboardRow = normalizeLeaderboardRow;
exports.handleLeaderboardError = handleLeaderboardError;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = require("../../utils/ApiError");
// Cache configuration
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const metadataCache = {
    years: null,
    cityYearMap: null,
};
/**
 * Build base WHERE and ORDER BY clauses using city_id (optimized for JWT data)
 */
function buildLeaderboardBaseQueryByCityId(year, cityId, search) {
    const params = [year];
    let whereClause = `WHERE b.year = $1`;
    let paramIndex = 2;
    let orderByClause = `ORDER BY l.alltime_global_rank ASC`;
    // City filter by ID (integer comparison - much faster than string)
    if (cityId && cityId > 0) {
        whereClause += ` AND s.city_id = $${paramIndex}`;
        params.push(cityId);
        paramIndex++;
        orderByClause = `ORDER BY l.alltime_city_rank ASC`;
    }
    // Search filter (optional)
    if (search) {
        whereClause += ` AND (s.name ILIKE $${paramIndex} OR s.username ILIKE $${paramIndex + 1})`;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex += 2;
    }
    return {
        whereClause,
        orderByClause,
        params,
        nextParamIndex: paramIndex,
    };
}
/**
 * Build base WHERE and ORDER BY clauses for leaderboard queries (legacy, for admin)
 */
function buildLeaderboardBaseQuery(filters) {
    const { city, year, search } = filters;
    // Year is required
    const effectiveYear = year || new Date().getFullYear();
    const params = [effectiveYear];
    let whereClause = `WHERE b.year = $1`;
    let paramIndex = 2;
    // City filter (optional) - by city_name for backward compatibility
    if (city && city !== "all") {
        whereClause += ` AND c.city_name = $${paramIndex}`;
        params.push(city);
        paramIndex++;
    }
    // Search filter (optional)
    if (search) {
        whereClause += ` AND (s.name ILIKE $${paramIndex} OR s.username ILIKE $${paramIndex + 1})`;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex += 2;
    }
    // Order by logic: global rank for 'all', city rank for specific city
    const orderByClause = city && city !== "all"
        ? `ORDER BY l.alltime_city_rank ASC`
        : `ORDER BY l.alltime_global_rank ASC`;
    return {
        whereClause,
        orderByClause,
        params,
        nextParamIndex: paramIndex,
    };
}
/**
 * Get cached available years
 */
async function getCachedYears() {
    const now = Date.now();
    if (metadataCache.years && metadataCache.years.expiresAt > now) {
        return metadataCache.years.data;
    }
    const years = await prisma_1.default.batch.findMany({
        select: { year: true },
        distinct: ["year"],
        orderBy: { year: "desc" },
    });
    const yearList = years.map((y) => y.year);
    metadataCache.years = {
        data: yearList,
        expiresAt: now + CACHE_TTL,
    };
    return yearList;
}
/**
 * Get cached city-year mapping
 */
async function getCachedCityYearMapping() {
    const now = Date.now();
    if (metadataCache.cityYearMap && metadataCache.cityYearMap.expiresAt > now) {
        return metadataCache.cityYearMap.data;
    }
    const query = `
    SELECT DISTINCT
      c.city_name,
      b.year
    FROM "City" c
    JOIN "Student" s ON s.city_id = c.id
    JOIN "Batch" b ON b.id = s.batch_id
    WHERE s.id IS NOT NULL
      AND b.year IS NOT NULL
    ORDER BY c.city_name, b.year DESC
  `;
    const results = (await prisma_1.default.$queryRawUnsafe(query));
    // Group by city
    const cityMap = {};
    results.forEach((row) => {
        if (!cityMap[row.city_name]) {
            cityMap[row.city_name] = [];
        }
        if (!cityMap[row.city_name].includes(row.year)) {
            cityMap[row.city_name].push(row.year);
        }
    });
    // Get all available years for "All Cities"
    const allYears = await getCachedYears();
    // Build final array
    const cityYearArray = [
        { city_name: "All Cities", available_years: allYears },
        ...Object.entries(cityMap)
            .map(([city_name, years]) => ({
            city_name,
            available_years: [...new Set(years)].sort((a, b) => b - a),
        }))
            .sort((a, b) => a.city_name.localeCompare(b.city_name)),
    ];
    metadataCache.cityYearMap = {
        data: cityYearArray,
        expiresAt: now + CACHE_TTL,
    };
    return cityYearArray;
}
/**
 * Get available years directly from DB (for validation)
 */
async function getAvailableYears() {
    return getCachedYears();
}
/**
 * Clear metadata cache (useful for testing or admin operations)
 */
function clearMetadataCache() {
    metadataCache.years = null;
    metadataCache.cityYearMap = null;
}
/**
 * Build the SELECT clause for leaderboard queries
 */
function buildSelectClause() {
    return `
    SELECT
      s.id AS student_id,
      s.name,
      s.username,
      s.profile_image_url,
      c.city_name,
      b.year AS batch_year,
      l.hard_solved,
      l.medium_solved,
      l.easy_solved,
      l.hard_solved + l.medium_solved + l.easy_solved AS total_solved,
      l.current_streak,
      l.max_streak,
      ROUND(
        (l.hard_solved::numeric / NULLIF(b.hard_assigned, 0) * 2000) +
        (l.medium_solved::numeric / NULLIF(b.medium_assigned, 0) * 1500) +
        (l.easy_solved::numeric / NULLIF(b.easy_assigned, 0) * 1000), 2
      ) AS score,
      l.alltime_global_rank,
      l.alltime_city_rank,
      l.last_calculated
  `;
}
/**
 * Build the FROM clause with JOINs - Optimized to start from Leaderboard
 */
function buildFromClause() {
    return `
    FROM "Leaderboard" l
    JOIN "Student" s ON s.id = l.student_id
    JOIN "Batch" b ON b.id = s.batch_id
    JOIN "City" c ON c.id = s.city_id
  `;
}
/**
 * Normalize leaderboard row data
 */
function normalizeLeaderboardRow(row) {
    return {
        student_id: row.student_id,
        name: row.name,
        username: row.username,
        profile_image_url: row.profile_image_url,
        city_name: row.city_name,
        batch_year: row.batch_year,
        hard_solved: Number(row.hard_solved),
        medium_solved: Number(row.medium_solved),
        easy_solved: Number(row.easy_solved),
        total_solved: Number(row.total_solved),
        current_streak: Number(row.current_streak),
        max_streak: Number(row.max_streak),
        score: Number(row.score) || 0,
        alltime_global_rank: Number(row.alltime_global_rank),
        alltime_city_rank: Number(row.alltime_city_rank),
        last_calculated: row.last_calculated,
    };
}
/**
 * Handle database errors consistently
 */
function handleLeaderboardError(error, context) {
    console.error(`${context} error:`, error);
    if (error instanceof ApiError_1.ApiError) {
        throw error;
    }
    if (error instanceof Error) {
        if (error.message.includes("parameter")) {
            throw new ApiError_1.ApiError(400, `Database query parameter error: ${error.message}. This usually indicates a problem with SQL parameter binding.`);
        }
        else if (error.message.includes("42P02")) {
            throw new ApiError_1.ApiError(400, `Database parameter error: Invalid parameter placeholder in SQL query. Please check the query construction.`);
        }
        else if (error.message.includes("42703")) {
            throw new ApiError_1.ApiError(400, `Database column error: A referenced column does not exist. ${error.message}`);
        }
        else if (error.message.includes("42P01")) {
            throw new ApiError_1.ApiError(400, `Database table error: A referenced table does not exist. ${error.message}`);
        }
        else {
            throw new ApiError_1.ApiError(400, `${context} error: ${error.message}`);
        }
    }
    throw new ApiError_1.ApiError(400, `Unknown ${context} error: ${String(error)}`);
}
