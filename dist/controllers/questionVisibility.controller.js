"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuestionVisibilityType = exports.getAllQuestionsWithFilters = exports.removeQuestionFromClass = exports.getAssignedQuestionsOfClass = exports.assignQuestionsToClass = void 0;
const questionVisibility_service_1 = require("../services/questionVisibility.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.assignQuestionsToClass = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        const classSlug = req.params.classSlug;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug", [], "INVALID_INPUT");
        }
        if (typeof classSlug !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid class slug", [], "INVALID_INPUT");
        }
        const { questions } = req.body;
        // Validation 1: Check if questions is provided
        if (!questions) {
            throw new ApiError_1.ApiError(400, "questions field is required", [], "REQUIRED_FIELD");
        }
        // Validation 2: Check if questions is an array
        if (!Array.isArray(questions)) {
            throw new ApiError_1.ApiError(400, "questions must be an array", [], "INVALID_INPUT");
        }
        // Validation 3: Check if array is not empty
        if (questions.length === 0) {
            throw new ApiError_1.ApiError(400, "questions array cannot be empty", [], "INVALID_INPUT");
        }
        // Validation 4: Check if all elements have required fields
        if (!questions.every(q => typeof q.question_id === 'number' && q.question_id > 0 &&
            (q.type === 'HOMEWORK' || q.type === 'CLASSWORK'))) {
            throw new ApiError_1.ApiError(400, "All questions must have question_id (positive number) and type (HOMEWORK or CLASSWORK)", [], "INVALID_INPUT");
        }
        // Validation 5: Check for duplicate question IDs in request
        const questionIds = questions.map(q => q.question_id);
        const duplicateIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
            throw new ApiError_1.ApiError(400, `Duplicate question IDs found in request: ${duplicateIds.join(', ')}`, [], "INVALID_INPUT");
        }
        const result = await (0, questionVisibility_service_1.assignQuestionsToClassService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            classSlug,
            questions: questions,
        });
        return res.json({
            message: "Questions assigned successfully",
            ...result,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, error.message, [], "INTERNAL_SERVER_ERROR");
    }
});
exports.getAssignedQuestionsOfClass = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        const classSlug = req.params.classSlug;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug", [], "INVALID_INPUT");
        }
        if (typeof classSlug !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid class slug", [], "INVALID_INPUT");
        }
        // Extract pagination and search parameters
        const { page = '1', limit = '25', search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const searchQuery = search;
        const assigned = await (0, questionVisibility_service_1.getAssignedQuestionsOfClassService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            classSlug,
            page: pageNum,
            limit: limitNum,
            search: searchQuery,
        });
        return res.json({
            message: "Assigned questions retrieved successfully",
            data: assigned.data,
            pagination: assigned.pagination,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, error.message, [], "INTERNAL_SERVER_ERROR");
    }
});
exports.removeQuestionFromClass = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        const classSlug = req.params.classSlug;
        const questionIdParam = req.params.questionId;
        if (typeof questionIdParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid question ID", [], "INVALID_INPUT");
        }
        const questionId = parseInt(questionIdParam);
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug", [], "INVALID_INPUT");
        }
        if (typeof classSlug !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid class slug", [], "INVALID_INPUT");
        }
        if (isNaN(questionId)) {
            throw new ApiError_1.ApiError(400, "Invalid question ID", [], "INVALID_INPUT");
        }
        await (0, questionVisibility_service_1.removeQuestionFromClassService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            classSlug,
            questionId,
        });
        return res.json({
            message: "Question removed successfully",
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, error.message, [], "INTERNAL_SERVER_ERROR");
    }
});
// Student-specific controller - get all questions with filters for student's batch
exports.getAllQuestionsWithFilters = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get student info from middleware (extractStudentInfo)
        const student = req.student;
        const batchId = req.batchId;
        const studentId = student?.id;
        if (!studentId || !batchId) {
            throw new ApiError_1.ApiError(400, "Student authentication required");
        }
        // Extract query parameters for filtering
        const { search, topic, level, platform, type, solved, page = '1', limit = '20' } = req.query;
        const filters = {
            search: search,
            topic: topic,
            level: level,
            platform: platform,
            type: type,
            solved: solved,
            page: parseInt(page),
            limit: parseInt(limit)
        };
        const questions = await (0, questionVisibility_service_1.getAllQuestionsWithFiltersService)({
            studentId,
            batchId,
            filters
        });
        return res.json(questions);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, error.message || "Failed to fetch questions");
    }
});
// Update question visibility type (homework/classwork)
exports.updateQuestionVisibilityType = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        const classSlug = req.params.classSlug;
        const visibilityIdParam = req.params.visibilityId;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug", [], "INVALID_INPUT");
        }
        if (typeof classSlug !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid class slug", [], "INVALID_INPUT");
        }
        if (typeof visibilityIdParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid visibility ID", [], "INVALID_INPUT");
        }
        const visibilityId = parseInt(visibilityIdParam);
        if (isNaN(visibilityId)) {
            throw new ApiError_1.ApiError(400, "Invalid visibility ID", [], "INVALID_INPUT");
        }
        const { type } = req.body;
        if (!type || (type !== 'HOMEWORK' && type !== 'CLASSWORK')) {
            throw new ApiError_1.ApiError(400, "Type must be HOMEWORK or CLASSWORK", [], "INVALID_INPUT");
        }
        const updated = await (0, questionVisibility_service_1.updateQuestionVisibilityTypeService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            classSlug,
            visibilityId,
            type
        });
        return res.json({
            message: "Question visibility type updated successfully",
            data: updated
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, error.message, [], "INTERNAL_SERVER_ERROR");
    }
});
