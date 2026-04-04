"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentProfile = void 0;
const profile_service_1 = require("../services/profile.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.updateStudentProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const studentId = req.user?.id;
        // ✅ Add validation for studentId
        if (!studentId) {
            throw new ApiError_1.ApiError(401, "Student ID not found");
        }
        const { leetcode_id, gfg_id, github, linkedin, username } = req.body;
        const updated = await (0, profile_service_1.updateStudentProfileData)(studentId, {
            leetcode_id,
            gfg_id,
            github,
            linkedin,
            username
        });
        res.json({
            message: "Profile updated successfully",
            student: updated
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to update profile");
    }
});
