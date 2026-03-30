"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfileImage = exports.uploadProfileImage = void 0;
const profileImage_service_1 = require("../services/profileImage.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.uploadProfileImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const studentId = req.user?.id;
        if (!studentId) {
            throw new ApiError_1.ApiError(401, 'Student ID not found');
        }
        if (!req.file) {
            throw new ApiError_1.ApiError(400, 'No file uploaded. Please provide a file with field name "file"');
        }
        const result = await profileImage_service_1.ProfileImageService.uploadProfileImage(studentId, req.file);
        res.status(201).json({
            success: true,
            message: 'Profile image uploaded successfully',
            data: {
                profileImageUrl: result.url,
                fileName: req.file.originalname,
                fileSize: req.file.size
            }
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        console.error('Upload profile image error:', error);
        throw new ApiError_1.ApiError(500, error instanceof Error ? error.message : 'Failed to upload profile image');
    }
});
exports.deleteProfileImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const studentId = req.user?.id;
        if (!studentId) {
            throw new ApiError_1.ApiError(401, 'Student ID not found');
        }
        await profileImage_service_1.ProfileImageService.deleteProfileImage(studentId);
        res.json({
            success: true,
            message: 'Profile image deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        console.error('Delete profile image error:', error);
        throw new ApiError_1.ApiError(500, error instanceof Error ? error.message : 'Failed to delete profile image');
    }
});
