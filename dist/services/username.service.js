"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUsernameService = exports.checkUsernameAvailabilityService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
const checkUsernameAvailabilityService = async (username, userId) => {
    // Trim whitespace
    const trimmedUsername = username.trim();
    // Don't check if username is too short
    if (trimmedUsername.length < 3) {
        return { available: false };
    }
    // Check if username already exists, excluding current user if userId provided
    const whereClause = { username: trimmedUsername };
    // If userId is provided, exclude current user from the check
    if (userId) {
        whereClause.id = { not: userId };
    }
    const existingStudent = await prisma_1.default.student.findUnique({
        where: whereClause,
        select: { id: true }
    });
    return { available: !existingStudent };
};
exports.checkUsernameAvailabilityService = checkUsernameAvailabilityService;
const updateUsernameService = async (studentId, username) => {
    if (!username) {
        throw new ApiError_1.ApiError(400, "Username is required", [], "REQUIRED_FIELD");
    }
    // Check if username is already taken
    const existingStudent = await prisma_1.default.student.findFirst({
        where: {
            username: username,
            id: { not: studentId }
        }
    });
    if (existingStudent) {
        throw new ApiError_1.ApiError(409, "Username already taken", [], "USERNAME_TAKEN");
    }
    // Update username
    const updatedStudent = await prisma_1.default.student.update({
        where: { id: studentId },
        data: { username },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            leetcode_id: true,
            gfg_id: true,
            github: true,
            linkedin: true,
            city_id: true,
            batch_id: true,
            created_at: true
        }
    });
    return updatedStudent;
};
exports.updateUsernameService = updateUsernameService;
