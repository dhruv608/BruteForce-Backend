"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignedQuestionsController = exports.deleteQuestion = exports.updateQuestion = exports.getAllQuestions = exports.createQuestion = void 0;
const question_service_1 = require("../services/question.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.createQuestion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const question = await (0, question_service_1.createQuestionService)(req.body);
        return res.status(201).json({
            message: "Question created successfully",
            question,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.getAllQuestions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { topicSlug, level, platform, type, search, page, limit, } = req.query;
        const result = await (0, question_service_1.getAllQuestionsService)({
            topicSlug: topicSlug,
            level: level,
            platform: platform,
            type: type,
            search: search,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
        });
        return res.json(result);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.updateQuestion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await (0, question_service_1.updateQuestionService)({
            id: Number(id),
            ...req.body,
        });
        return res.json({
            message: "Question updated successfully",
            question: updated,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.deleteQuestion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        await (0, question_service_1.deleteQuestionService)({
            id: Number(id),
        });
        return res.json({
            message: "Question deleted successfully",
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.getAssignedQuestionsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const data = await (0, question_service_1.getAssignedQuestionsService)(req.query);
        return res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        return res.status(400).json({
            success: false,
            error: error.message || "Failed to fetch questions"
        });
    }
});
