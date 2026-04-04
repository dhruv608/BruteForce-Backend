"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentProfileData = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
const updateStudentProfileData = async (studentId, { leetcode_id, gfg_id, github, linkedin, username }) => {
    // Get current student to check if they already have city and batch
    const currentStudent = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        select: { city_id: true, batch_id: true }
    });
    if (!currentStudent) {
        throw new ApiError_1.ApiError(404, "Student not found", [], "STUDENT_NOT_FOUND");
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
            city_id: true,
            batch_id: true,
            created_at: true
        }
    });
    return updated;
};
exports.updateStudentProfileData = updateStudentProfileData;
