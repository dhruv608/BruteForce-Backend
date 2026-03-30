"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentProfile = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
const s3_service_1 = require("../services/s3.service");
// Helper function to extract S3 key from URL
function getS3KeyFromUrl(url) {
    if (!url)
        return '';
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/');
}
exports.updateStudentProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const studentId = req.user?.id;
        // Handle both JSON and multipart/form-data
        const { leetcode_id, gfg_id, github, linkedin, username, profile_image_url } = req.body;
        const file = req.file; // From multer middleware
        console.log('Request body:', req.body);
        console.log('File:', file ? `File found: ${file.originalname}` : 'No file');
        // Get current student to check existing profile image
        const currentStudent = await prisma_1.default.student.findUnique({
            where: { id: studentId },
            select: { profile_image_url: true, city_id: true, batch_id: true }
        });
        if (!currentStudent) {
            throw new ApiError_1.ApiError(404, "Student not found");
        }
        // Handle profile image upload
        let newProfileImageUrl = currentStudent.profile_image_url;
        if (file) {
            console.log('Uploading new image to S3...');
            // Upload new image to S3
            const uploadResult = await s3_service_1.S3Service.uploadFile(file, 'profile-images');
            newProfileImageUrl = uploadResult.url;
            console.log('Image uploaded successfully:', newProfileImageUrl);
            // Delete old image from S3 if exists
            if (currentStudent.profile_image_url) {
                const oldKey = getS3KeyFromUrl(currentStudent.profile_image_url);
                await s3_service_1.S3Service.deleteFile(oldKey);
                console.log('Old image deleted from S3');
            }
        }
        else if (profile_image_url === "" || profile_image_url === null) {
            console.log('Deleting profile image...');
            // Delete profile image
            if (currentStudent.profile_image_url) {
                const oldKey = getS3KeyFromUrl(currentStudent.profile_image_url);
                await s3_service_1.S3Service.deleteFile(oldKey);
                console.log('Image deleted from S3');
            }
            newProfileImageUrl = null;
        }
        // Build update data - only include fields that are provided
        const updateData = {};
        if (leetcode_id !== undefined)
            updateData.leetcode_id = leetcode_id;
        if (gfg_id !== undefined)
            updateData.gfg_id = gfg_id;
        if (github !== undefined)
            updateData.github = github;
        if (linkedin !== undefined)
            updateData.linkedin = linkedin;
        if (username !== undefined && username.trim())
            updateData.username = username;
        if (file || profile_image_url === "" || profile_image_url === null) {
            updateData.profile_image_url = newProfileImageUrl;
        }
        console.log('Update data:', updateData);
        try {
            const updated = await prisma_1.default.student.update({
                where: { id: studentId },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    leetcode_id: true,
                    gfg_id: true,
                    github: true,
                    linkedin: true,
                    profile_image_url: true,
                    city_id: true,
                    batch_id: true,
                    created_at: true
                }
            });
            console.log('Profile updated successfully:', updated);
            res.json({
                message: "Profile updated successfully",
                student: updated,
            });
        }
        catch (prismaError) {
            console.error('Prisma error details:', {
                code: prismaError.code,
                message: prismaError.message,
                meta: prismaError.meta,
                target: prismaError.target
            });
            throw new ApiError_1.ApiError(500, `Database error: ${prismaError.message}`);
        }
    }
    catch (error) {
        console.error('Update profile error:', error);
        if (error instanceof ApiError_1.ApiError)
            throw error;
        // Handle unique constraint errors
        if (error.code === "P2002") {
            const field = error.meta?.target;
            if (field?.includes("username")) {
                throw new ApiError_1.ApiError(400, "Username already exists");
            }
            if (field?.includes("email")) {
                throw new ApiError_1.ApiError(400, "Email already exists");
            }
        }
        throw new ApiError_1.ApiError(500, "Failed to update profile");
    }
});
