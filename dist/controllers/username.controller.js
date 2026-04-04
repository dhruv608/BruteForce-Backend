"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUsername = exports.checkUsernameAvailability = void 0;
const username_service_1 = require("../services/username.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.checkUsernameAvailability = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { username, userId } = req.query;
        if (!username || typeof username !== 'string') {
            throw new ApiError_1.ApiError(400, "Username parameter is required", [], "REQUIRED_FIELD");
        }
        const result = await (0, username_service_1.checkUsernameAvailabilityService)(username, userId);
        res.json(result);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to check username availability", [], "INTERNAL_SERVER_ERROR");
    }
});
exports.updateUsername = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { username } = req.body;
        if (!studentId) {
            throw new ApiError_1.ApiError(401, "Student not authenticated", [], "UNAUTHORIZED");
        }
        const updatedStudent = await (0, username_service_1.updateUsernameService)(studentId, username);
        res.json({
            message: "Username updated successfully",
            student: updatedStudent
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to update username", [], "INTERNAL_SERVER_ERROR");
    }
});
