"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopicProgressByUsername = exports.createTopicsBulk = exports.getTopicOverviewWithClassesSummary = exports.getTopicsWithBatchProgress = exports.deleteTopic = exports.updateTopic = exports.getTopicsForBatch = exports.getAllTopics = exports.createTopic = void 0;
const topic_service_1 = require("../services/topic.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
const slugify_1 = require("../utils/slugify");
exports.createTopic = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    console.log("Create Topic req.body:", req.body);
    const topic_name = req.body?.topic_name;
    const photo = req.file;
    if (!topic_name) {
        throw new ApiError_1.ApiError(400, "Topic name required", [], "REQUIRED_FIELD");
    }
    const topic = await (0, topic_service_1.createTopicService)({ topic_name, photo });
    return res.status(201).json({
        message: "Topic created successfully",
        topic,
    });
});
// Get All Topics
exports.getAllTopics = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const topics = await (0, topic_service_1.getAllTopicsService)();
    return res.json(topics);
});
exports.getTopicsForBatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const batch = req.batch;
    const data = await (0, topic_service_1.getTopicsForBatchService)({
        batchId: batch.id,
        query: req.query
    });
    return res.json(data);
});
exports.updateTopic = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    console.log("Update Topic req.body:", req.body);
    const topicSlug = req.params.topicSlug;
    const topic_name = req.body?.topic_name;
    const removePhoto = req.body?.removePhoto;
    const photo = req.file;
    if (!topic_name) {
        throw new ApiError_1.ApiError(400, "Topic name required", [], "REQUIRED_FIELD");
    }
    const topic = await (0, topic_service_1.updateTopicService)({
        topicSlug,
        topic_name,
        photo,
        removePhoto: removePhoto === 'true' || removePhoto === true,
    });
    return res.json({
        message: "Topic updated successfully",
        topic,
    });
});
exports.deleteTopic = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const topicSlug = req.params.topicSlug;
    await (0, topic_service_1.deleteTopicService)({
        topicSlug,
    });
    return res.json({
        message: "Topic deleted successfully",
    });
});
// Student-specific controller - get topics with batch progress
exports.getTopicsWithBatchProgress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Get student info from middleware (extractStudentInfo)
    const student = req.student;
    const batchId = req.batchId;
    const studentId = student?.id;
    if (!studentId || !batchId) {
        throw new ApiError_1.ApiError(401, "Student authentication required", [], "UNAUTHORIZED");
    }
    const topics = await (0, topic_service_1.getTopicsWithBatchProgressService)({
        studentId,
        batchId,
    });
    return res.json(topics);
});
// Student-specific controller - get topic overview with classes summary
exports.getTopicOverviewWithClassesSummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Get student info from middleware (extractStudentInfo)
    const student = req.student;
    const batchId = req.batchId;
    const { topicSlug } = req.params;
    const studentId = student?.id;
    // Ensure topicSlug is a string (not string array)
    const slug = Array.isArray(topicSlug) ? topicSlug[0] : topicSlug;
    if (!studentId || !batchId || !slug) {
        throw new ApiError_1.ApiError(400, "Student authentication and topic slug required", [], "REQUIRED_FIELD");
    }
    const topicOverview = await (0, topic_service_1.getTopicOverviewWithClassesSummaryService)({
        studentId,
        batchId,
        topicSlug: slug,
        query: req.query,
    });
    return res.json(topicOverview);
});
exports.createTopicsBulk = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { topics } = req.body;
    if (!topics || !Array.isArray(topics)) {
        throw new ApiError_1.ApiError(400, "Topics array is required", [], "REQUIRED_FIELD");
    }
    // Format topics with slugs
    const formattedTopics = topics.map((topic) => ({
        topic_name: topic.topic_name,
        slug: (0, slugify_1.generateSlug)(topic.topic_name),
    }));
    const created = await (0, topic_service_1.createTopicsBulkService)(formattedTopics);
    return res.status(201).json({
        message: "Topics created successfully",
        created: created,
    });
});
// Update the getTopicProgressByUsername function:
exports.getTopicProgressByUsername = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { username } = req.params;
    const { sortBy = 'solved' } = req.query;
    // ✅ Add validation and type assertion
    if (!username || Array.isArray(username)) {
        throw new ApiError_1.ApiError(400, "Valid username is required", [], "REQUIRED_FIELD");
    }
    const result = await (0, topic_service_1.getTopicProgressByUsernameService)(username);
    // Sort topics based on sortBy parameter
    let sortedTopics = result.topics;
    if (sortBy === 'solved') {
        sortedTopics.sort((a, b) => b.solvedQuestions - a.solvedQuestions);
    }
    else if (sortBy === 'progress') {
        sortedTopics.sort((a, b) => b.progressPercentage - a.progressPercentage);
    }
    return res.status(200).json({
        success: true,
        student: result.student,
        topics: sortedTopics,
    });
});
