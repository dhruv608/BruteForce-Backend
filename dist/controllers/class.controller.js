"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassDetailsWithFullQuestions = exports.deleteClass = exports.updateClass = exports.getClassDetails = exports.createClassInTopic = exports.getClassesByTopic = void 0;
const class_service_1 = require("../services/class.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.getClassesByTopic = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug");
        }
        // Extract pagination and search parameters
        const { page = '1', limit = '20', search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const searchQuery = search;
        const classes = await (0, class_service_1.getClassesByTopicService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            page: pageNum,
            limit: limitNum,
            search: searchQuery,
        });
        return res.json(classes);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.createClassInTopic = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug");
        }
        const { class_name, description, pdf_url, duration_minutes, class_date, } = req.body;
        // Handle PDF file upload
        const pdf_file = req.file;
        const newClass = await (0, class_service_1.createClassInTopicService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            class_name,
            description,
            pdf_url,
            pdf_file,
            duration_minutes,
            class_date,
        });
        return res.status(201).json({
            message: "Class created successfully",
            class: newClass,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.getClassDetails = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        const classSlugParam = req.params.classSlug;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug");
        }
        if (typeof classSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid class slug");
        }
        const classDetails = await (0, class_service_1.getClassDetailsService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            classSlug: classSlugParam,
        });
        return res.json(classDetails);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.updateClass = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        const classSlug = req.params.classSlug;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug");
        }
        if (typeof classSlug !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid class slug");
        }
        const updated = await (0, class_service_1.updateClassService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            classSlug,
            ...req.body,
            pdf_file: req.file, // Handle PDF file upload
        });
        return res.json({
            message: "Class updated successfully",
            class: updated,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.deleteClass = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const batch = req.batch;
        const topicSlugParam = req.params.topicSlug;
        const classSlug = req.params.classSlug;
        if (typeof topicSlugParam !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid topic slug");
        }
        if (typeof classSlug !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid class slug");
        }
        await (0, class_service_1.deleteClassService)({
            batchId: batch.id,
            topicSlug: topicSlugParam,
            classSlug,
        });
        return res.json({
            message: "Class deleted successfully",
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
// Student-specific controller - get class details with full questions array
exports.getClassDetailsWithFullQuestions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get student info from middleware (extractStudentInfo)
        const student = req.student;
        const batchId = req.batchId;
        const { topicSlug, classSlug } = req.params;
        const studentId = student?.id;
        // Ensure slugs are strings (not string arrays)
        const topic = Array.isArray(topicSlug) ? topicSlug[0] : topicSlug;
        const cls = Array.isArray(classSlug) ? classSlug[0] : classSlug;
        if (!studentId || !batchId || !topic || !cls) {
            throw new ApiError_1.ApiError(400, "Student authentication and topic/class slugs required");
        }
        const classDetails = await (0, class_service_1.getClassDetailsWithFullQuestionsService)({
            studentId,
            batchId,
            topicSlug: topic,
            classSlug: cls,
            query: req.query,
        });
        return res.json(classDetails);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, error.message || "Failed to fetch class details");
    }
});
