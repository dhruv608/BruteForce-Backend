"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStudentProgressController = exports.createStudentController = exports.getStudentReportController = exports.getAllStudentsController = exports.deleteStudentDetails = exports.updateStudentDetails = exports.getCurrentStudent = void 0;
const student_service_1 = require("../services/student.service");
const student_service_2 = require("../services/student.service");
const student_service_3 = require("../services/student.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.getCurrentStudent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const studentId = req.user?.id;
    if (!studentId) {
        throw new ApiError_1.ApiError(401, "Student not authenticated", [], "UNAUTHORIZED");
    }
    const student = await (0, student_service_1.getCurrentStudentService)(studentId);
    return res.status(200).json({
        success: true,
        data: {
            id: student.id,
            name: student.name,
            username: student.username,
            city: student.city,
            batch: student.batch,
            email: student.email,
            profileImageUrl: student.profile_image_url,
            leetcode: student.leetcode_id,
            gfg: student.gfg_id
        }
    });
});
exports.updateStudentDetails = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const student = await (0, student_service_2.updateStudentDetailsService)(Number(id), req.body);
    return res.json({
        message: "Student updated successfully",
        data: student
    });
});
exports.deleteStudentDetails = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const studentId = Number(id);
    if (isNaN(studentId)) {
        throw new ApiError_1.ApiError(400, "Invalid student id", [], "INVALID_INPUT");
    }
    await (0, student_service_2.deleteStudentDetailsService)(studentId);
    return res.status(200).json({
        message: "Student deleted permanently"
    });
});
exports.getAllStudentsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, student_service_2.getAllStudentsService)(req.query);
    return res.status(200).json(result);
});
exports.getStudentReportController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { username } = req.params;
    const usernameStr = Array.isArray(username) ? username[0] : username;
    const result = await (0, student_service_2.getStudentReportService)(usernameStr);
    return res.status(200).json(result);
});
exports.createStudentController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const student = await (0, student_service_3.createStudentService)(req.body);
    return res.status(201).json({
        message: "Student created successfully",
        data: student
    });
});
exports.addStudentProgressController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { student_id, question_id } = req.body;
    if (!student_id || !question_id) {
        throw new ApiError_1.ApiError(400, "student_id and question_id are required", [], "REQUIRED_FIELD");
    }
    const progress = await (0, student_service_1.addStudentProgressService)(Number(student_id), Number(question_id));
    return res.status(201).json({
        message: "Student progress added successfully",
        data: progress
    });
});
