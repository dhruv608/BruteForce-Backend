"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.logoutAdmin = exports.logoutStudent = exports.googleLogin = exports.refreshToken = exports.loginAdmin = exports.registerAdmin = exports.loginStudent = exports.registerStudent = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const authService = __importStar(require("../services/auth.service"));
// Student Registration
exports.registerStudent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const student = await authService.registerStudent(req.body);
    res.status(201).json({
        message: 'Student registered successfully',
        user: student,
    });
});
// Student Login
exports.loginStudent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.loginStudent(req.body);
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
    res.json({
        message: 'Login successful',
        accessToken,
        user,
    });
});
// Admin/Teacher Registration
exports.registerAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.registerAdmin({
        ...req.body,
        currentUserRole: req.user?.role
    });
    res.status(201).json({
        message: 'Admin registered successfully',
        accessToken,
        user,
    });
});
// Admin Login
exports.loginAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.loginAdmin(req.body);
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
    res.json({
        message: 'Login successful',
        accessToken,
        user,
    });
});
exports.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    res.json({ accessToken });
});
exports.googleLogin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    const { user, accessToken, refreshToken } = await authService.googleAuth(idToken);
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
    res.json({
        message: "Google login successful",
        accessToken,
        user,
    });
});
// Student Logout
exports.logoutStudent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const studentId = req.student?.id;
    await authService.logoutStudent(studentId);
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    res.json({
        message: "Student logout successful",
    });
});
// Admin Logout
exports.logoutAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const adminId = req.admin?.id;
    await authService.logoutAdmin(adminId);
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    res.json({
        message: "Admin logout successful",
    });
});
// Forgot Password - Send OTP
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const result = await authService.sendPasswordResetOTP(email);
    res.json(result);
});
// Verify OTP - Only validate OTP, don't reset password
exports.verifyOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    res.json(result);
});
// Reset Password - Verify OTP and reset password
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    res.json(result);
});
