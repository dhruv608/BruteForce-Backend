"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentQuestions = void 0;
const recentQuestions_service_1 = require("../services/recentQuestions.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.getRecentQuestions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get batch info from middleware (extractStudentInfo)
        const batchId = req.batchId;
        const { date, page, limit } = req.query;
        if (!batchId) {
            throw new ApiError_1.ApiError(401, "Student authentication required", [], "UNAUTHORIZED");
        }
        // Validate date parameter (format: YYYY-MM-DD)
        let dateParam;
        if (date) {
            const dateStr = date;
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateStr)) {
                throw new ApiError_1.ApiError(400, "Date parameter must be in YYYY-MM-DD format", [], "INVALID_INPUT");
            }
            // Validate if it's a valid date
            const parsedDate = new Date(dateStr);
            if (isNaN(parsedDate.getTime())) {
                throw new ApiError_1.ApiError(400, "Invalid date provided", [], "INVALID_INPUT");
            }
            dateParam = dateStr;
        }
        // Parse pagination params
        const pageParam = page ? parseInt(page, 10) : undefined;
        const limitParam = limit ? parseInt(limit, 10) : undefined;
        const result = await (0, recentQuestions_service_1.getRecentQuestionsService)({
            batchId,
            date: dateParam,
            page: pageParam,
            limit: limitParam
        });
        return res.json(result);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, error.message || "Failed to fetch recent questions", [], "INTERNAL_SERVER_ERROR");
    }
});
