"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolesController = exports.deleteAdminController = exports.updateAdminController = exports.getAllAdminsController = exports.createAdminController = exports.getAdminStats = exports.getCurrentAdminController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const admin_service_1 = require("../services/admin.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.getCurrentAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get admin info from middleware (extracted from token)
        const adminInfo = req.admin;
        if (!adminInfo) {
            throw new ApiError_1.ApiError(401, "Admin not authenticated", [], "AUTH_ERROR");
        }
        // Get full admin details from database
        const admin = await prisma_1.default.admin.findUnique({
            where: { id: adminInfo.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                city_id: true,
                batch_id: true,
                city: {
                    select: {
                        id: true,
                        city_name: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        batch_name: true,
                        year: true
                    }
                }
            }
        });
        if (!admin) {
            throw new ApiError_1.ApiError(404, "Admin not found", [], "ADMIN_NOT_FOUND");
        }
        return res.status(200).json({
            success: true,
            data: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                cityId: admin.city_id,
                batchId: admin.batch_id,
                city: admin.city,
                batch: admin.batch
            }
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch current admin", [], "SERVER_ERROR");
    }
});
exports.getAdminStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { batch_id } = req.body;
        // Validate batch_id
        if (!batch_id || isNaN(parseInt(batch_id))) {
            throw new ApiError_1.ApiError(400, "Valid batch_id is required", [], "VALIDATION_ERROR");
        }
        const batchId = parseInt(batch_id);
        // Check if batch exists
        const batch = await prisma_1.default.batch.findUnique({
            where: { id: batchId },
            include: {
                city: {
                    select: {
                        city_name: true
                    }
                }
            }
        });
        if (!batch) {
            throw new ApiError_1.ApiError(404, "Batch not found", [], "BATCH_NOT_FOUND");
        }
        // Get total classes for this batch
        const totalClasses = await prisma_1.default.class.count({
            where: { batch_id: batchId }
        });
        // Get total students for this batch
        const totalStudents = await prisma_1.default.student.count({
            where: { batch_id: batchId }
        });
        // Get all questions assigned to this batch's classes
        const assignedQuestions = await prisma_1.default.questionVisibility.findMany({
            where: {
                class: {
                    batch_id: batchId
                }
            },
            include: {
                question: {
                    select: {
                        level: true,
                        platform: true,
                        type: true
                    }
                }
            }
        });
        const totalQuestions = assignedQuestions.length;
        // Calculate questions by type
        const questionsByType = {
            homework: assignedQuestions.filter((qc) => qc.question.type === 'HOMEWORK').length,
            classwork: assignedQuestions.filter((qc) => qc.question.type === 'CLASSWORK').length
        };
        // Calculate questions by level
        const questionsByLevel = {
            easy: assignedQuestions.filter((qc) => qc.question.level === 'EASY').length,
            medium: assignedQuestions.filter((qc) => qc.question.level === 'MEDIUM').length,
            hard: assignedQuestions.filter((qc) => qc.question.level === 'HARD').length
        };
        // Calculate questions by platform
        const questionsByPlatform = {
            leetcode: assignedQuestions.filter((qc) => qc.question.platform === 'LEETCODE').length,
            gfg: assignedQuestions.filter((qc) => qc.question.platform === 'GFG').length,
            other: assignedQuestions.filter((qc) => qc.question.platform === 'OTHER').length,
            interviewbit: assignedQuestions.filter((qc) => qc.question.platform === 'INTERVIEWBIT').length
        };
        // Get total topics discussed for this batch
        const totalTopicsDiscussed = await prisma_1.default.topic.count({
            where: {
                classes: {
                    some: {
                        batch_id: batchId
                    }
                }
            }
        });
        return res.status(200).json({
            success: true,
            data: {
                batch_id: batchId,
                batch_name: batch.batch_name,
                city: batch.city.city_name,
                year: batch.year,
                total_classes: totalClasses,
                total_questions: totalQuestions,
                total_students: totalStudents,
                questions_by_type: questionsByType,
                questions_by_level: questionsByLevel,
                questions_by_platform: questionsByPlatform,
                total_topics_discussed: totalTopicsDiscussed
            }
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch batch statistics", [], "SERVER_ERROR");
    }
});
exports.createAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const adminData = req.body;
        // Validate required fields (removed username)
        if (!adminData.name || !adminData.email || !adminData.password) {
            throw new ApiError_1.ApiError(400, "Missing required fields: name, email, password", [], "VALIDATION_ERROR");
        }
        const newAdmin = await (0, admin_service_1.createAdminService)(adminData);
        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: newAdmin
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, "Failed to create admin", [], "ADMIN_CREATE_ERROR");
    }
});
exports.getAllAdminsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const filters = req.query;
        // Default to TEACHER role if no role filter is provided (SuperAdmin context)
        if (!filters.role) {
            filters.role = 'TEACHER';
        }
        const admins = await (0, admin_service_1.getAllAdminsService)(filters);
        return res.status(200).json({
            success: true,
            data: admins
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch admins", [], "SERVER_ERROR");
    }
});
exports.updateAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id || isNaN(parseInt(id))) {
            throw new ApiError_1.ApiError(400, "Valid admin ID is required", [], "VALIDATION_ERROR");
        }
        const updatedAdmin = await (0, admin_service_1.updateAdminService)(parseInt(id), updateData);
        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        const statusCode = error.message === 'Admin not found' ? 404 : 400;
        const errorCode = error.message === 'Admin not found' ? 'ADMIN_NOT_FOUND' : 'ADMIN_UPDATE_ERROR';
        throw new ApiError_1.ApiError(statusCode, error.message || "Failed to update admin", [], errorCode);
    }
});
exports.deleteAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            throw new ApiError_1.ApiError(400, "Valid admin ID is required", [], "VALIDATION_ERROR");
        }
        const result = await (0, admin_service_1.deleteAdminService)(parseInt(id));
        return res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        const statusCode = error.message === 'Admin not found' ? 404 : 500;
        const errorCode = error.message === 'Admin not found' ? 'ADMIN_NOT_FOUND' : 'ADMIN_DELETE_ERROR';
        throw new ApiError_1.ApiError(statusCode, error.message || "Failed to delete admin", [], errorCode);
    }
});
exports.getRolesController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const roles = Object.values(client_1.AdminRole);
        return res.status(200).json({
            success: true,
            data: roles
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch roles", [], "SERVER_ERROR");
    }
});
