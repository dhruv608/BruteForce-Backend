"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentById = void 0;
const studentProfile_service_1 = require("../services/studentProfile.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.getStudentById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id; // From optional auth middleware
        if (!id || Array.isArray(id)) {
            throw new ApiError_1.ApiError(400, "Student ID is required");
        }
        // First get student by ID to find their username
        const prisma = require("../config/prisma").default;
        const student = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            select: { username: true }
        });
        if (!student) {
            throw new ApiError_1.ApiError(404, "Student not found");
        }
        if (!student.username) {
            throw new ApiError_1.ApiError(404, "Student profile not accessible - username not set");
        }
        // Use existing service with the username
        const profile = await (0, studentProfile_service_1.getPublicStudentProfileService)(student.username);
        // Add canEdit flag if current user is viewing their own profile
        const canEdit = currentUserId && profile.student.id === currentUserId;
        res.json({ ...profile, canEdit });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        console.error("Student by ID error:", error);
        throw new ApiError_1.ApiError(500, error instanceof Error ? error.message : "Failed to get student profile by ID");
    }
});
