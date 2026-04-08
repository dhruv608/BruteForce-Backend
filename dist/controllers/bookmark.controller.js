"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookmark = exports.updateBookmark = exports.addBookmark = exports.getBookmarks = void 0;
const bookmark_service_1 = require("../services/bookmark.service");
const ApiError_1 = require("../utils/ApiError");
// ==============================
// GET ALL BOOKMARKS
// ==============================
const getBookmarks = async (req, res) => {
    try {
        const studentId = req.student.id;
        const { page = 1, limit = 10, sort = 'recent', filter = 'all' } = req.query;
        // Validate query parameters
        const validSorts = ['recent', 'old', 'solved', 'unsolved'];
        const validFilters = ['all', 'solved', 'unsolved'];
        if (!validSorts.includes(sort)) {
            throw new ApiError_1.ApiError(400, "Invalid sort parameter");
        }
        if (!validFilters.includes(filter)) {
            throw new ApiError_1.ApiError(400, "Invalid filter parameter");
        }
        const result = await (0, bookmark_service_1.getBookmarksService)(studentId, {
            page: Number(page),
            limit: Number(limit),
            sort: sort,
            filter: filter
        });
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code || "SERVER_ERROR",
                    message: error.message,
                    details: error.errors || []
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to fetch bookmarks",
                    details: []
                }
            });
        }
    }
};
exports.getBookmarks = getBookmarks;
// ==============================
// ADD BOOKMARK
// ==============================
const addBookmark = async (req, res) => {
    try {
        const studentId = req.student.id;
        const { question_id, description } = req.body;
        // Validation
        if (!question_id) {
            throw new ApiError_1.ApiError(400, "Question ID is required", [], "VALIDATION_ERROR");
        }
        if (typeof question_id !== 'number') {
            throw new ApiError_1.ApiError(400, "Question ID must be a number", [], "VALIDATION_ERROR");
        }
        const bookmark = await (0, bookmark_service_1.addBookmarkService)(studentId, question_id, description);
        res.status(201).json({
            success: true,
            data: bookmark
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code || "SERVER_ERROR",
                    message: error.message,
                    details: error.errors || []
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to add bookmark",
                    details: []
                }
            });
        }
    }
};
exports.addBookmark = addBookmark;
// ==============================
// UPDATE BOOKMARK
// ==============================
const updateBookmark = async (req, res) => {
    try {
        const studentId = req.student.id;
        const { questionId } = req.params;
        const { description } = req.body;
        // Validation
        if (!questionId) {
            throw new ApiError_1.ApiError(400, "Question ID is required", [], "VALIDATION_ERROR");
        }
        if (typeof description !== 'string') {
            throw new ApiError_1.ApiError(400, "Description must be a string", [], "VALIDATION_ERROR");
        }
        const bookmark = await (0, bookmark_service_1.updateBookmarkService)(studentId, Number(questionId), description);
        res.status(200).json({
            success: true,
            data: bookmark
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code || "SERVER_ERROR",
                    message: error.message,
                    details: error.errors || []
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to update bookmark",
                    details: []
                }
            });
        }
    }
};
exports.updateBookmark = updateBookmark;
// ==============================
// DELETE BOOKMARK
// ==============================
const deleteBookmark = async (req, res) => {
    try {
        const studentId = req.student.id;
        const { questionId } = req.params;
        // Validation
        if (!questionId) {
            throw new ApiError_1.ApiError(400, "Question ID is required", [], "VALIDATION_ERROR");
        }
        await (0, bookmark_service_1.deleteBookmarkService)(studentId, Number(questionId));
        res.status(200).json({
            success: true,
            message: "Bookmark removed successfully"
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code || "SERVER_ERROR",
                    message: error.message,
                    details: error.errors || []
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to delete bookmark",
                    details: []
                }
            });
        }
    }
};
exports.deleteBookmark = deleteBookmark;
