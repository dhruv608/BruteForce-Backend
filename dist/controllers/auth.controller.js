"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logoutAdmin = exports.logoutStudent = exports.googleLogin = exports.refreshToken = exports.loginAdmin = exports.registerAdmin = exports.loginStudent = exports.registerStudent = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const password_util_1 = require("../utils/password.util");
const jwt_util_1 = require("../utils/jwt.util");
const google_auth_library_1 = require("google-auth-library");
const otp_util_1 = require("../utils/otp.util");
const email_util_1 = require("../utils/email.util");
const emailValidation_util_1 = require("../utils/emailValidation.util");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Student Registration
const registerStudent = async (req, res) => {
    try {
        const { name, email, username, password, enrollment_id, batch_id, leetcode_id, gfg_id } = req.body;
        // Validation
        if (!name || !email || !username || !password || !batch_id) {
            return res.status(400).json({
                error: 'Name, email, username, password, and batch_id are required'
            });
        }
        // Validate email domain
        const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({
                error: emailValidation.error
            });
        }
        // Check existing user
        const existingStudent = await prisma_1.default.student.findFirst({
            where: {
                OR: [{ email }, { username }, { enrollment_id }],
            },
        });
        if (existingStudent) {
            return res.status(400).json({
                error: 'Email, username, or enrollment_id already exists'
            });
        }
        // Get batch information to fetch city_id
        const batch = await prisma_1.default.batch.findUnique({
            where: { id: batch_id },
            include: { city: true }
        });
        if (!batch) {
            return res.status(400).json({ error: 'Invalid batch_id' });
        }
        // Hash password
        const password_hash = await (0, password_util_1.hashPassword)(password);
        // Create student
        const student = await prisma_1.default.student.create({
            data: {
                name,
                email,
                username,
                password_hash,
                enrollment_id,
                batch_id,
                city_id: batch.city.id, // Fetch city_id from batch
                leetcode_id,
                gfg_id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                enrollment_id: true,
                batch_id: true,
                city_id: true,
                leetcode_id: true,
                gfg_id: true,
                created_at: true,
                batch: {
                    select: {
                        id: true,
                        batch_name: true,
                        slug: true,
                        year: true
                    }
                },
                city: {
                    select: {
                        id: true,
                        city_name: true
                    }
                }
            },
        });
        res.status(201).json({
            message: 'Student registered successfully',
            user: student,
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register student' });
    }
};
exports.registerStudent = registerStudent;
// Student Login
const loginStudent = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if ((!email && !username) || !password) {
            return res.status(400).json({
                error: 'Either email or username with password are required'
            });
        }
        // Validate email domain if email is provided
        if (email) {
            const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
            if (!emailValidation.isValid) {
                return res.status(400).json({
                    error: emailValidation.error
                });
            }
        }
        // Find student by email or username
        const student = await prisma_1.default.student.findFirst({
            where: {
                OR: [
                    email ? { email } : {},
                    username ? { username } : {}
                ]
            },
            include: {
                city: true,
                batch: true,
            },
        });
        if (!student || !student.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Compare password
        const isValidPassword = await (0, password_util_1.comparePassword)(password, student.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const accessToken = (0, jwt_util_1.generateAccessToken)({
            id: student.id,
            email: student.email,
            role: 'STUDENT',
            userType: 'student',
            ...(student.batch && student.city && {
                batchId: student.batch.id,
                batchName: student.batch.batch_name,
                batchSlug: student.batch.slug,
                cityId: student.city.id,
                cityName: student.city.city_name,
            }),
        });
        const refreshToken = (0, jwt_util_1.generateRefreshToken)({
            id: student.id,
            userType: 'student',
        });
        await prisma_1.default.student.update({
            where: { id: student.id },
            data: { refresh_token: refreshToken },
        });
        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: student.id,
                name: student.name,
                email: student.email,
                username: student.username,
                city: student.city,
                batch: student.batch,
                leetcode_id: student.leetcode_id,
                gfg_id: student.gfg_id,
                cityId: student.city_id,
                cityName: student.city?.city_name || null,
                batchId: student.batch_id,
                batchName: student.batch?.batch_name || null,
                batchSlug: student.batch?.slug || null
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};
exports.loginStudent = loginStudent;
// Admin/Teacher Registration
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Check existing admin
        const existingAdmin = await prisma_1.default.admin.findFirst({
            where: {
                email,
            },
        });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        if (req.user?.role !== "SUPERADMIN") {
            return res.status(403).json({ error: "Only SuperAdmin can create admin" });
        }
        if (role !== "TEACHER" && role !== "INTERN" && role !== "SUPERADMIN") {
            return res.status(400).json({ error: "Invalid role type" });
        }
        const password_hash = await (0, password_util_1.hashPassword)(password);
        const admin = await prisma_1.default.admin.create({
            data: {
                name,
                email,
                password_hash,
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
            },
        });
        const accessToken = (0, jwt_util_1.generateAccessToken)({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            userType: 'admin',
        });
        const refreshToken = (0, jwt_util_1.generateRefreshToken)({
            id: admin.id,
            userType: 'admin',
        });
        await prisma_1.default.admin.update({
            where: { id: admin.id },
            data: { refresh_token: refreshToken },
        });
        res.status(201).json({
            message: 'Admin registered successfully',
            accessToken,
            refreshToken,
            user: admin,
        });
    }
    catch (error) {
        console.error('Admin register error:', error);
        res.status(500).json({ error: 'Failed to register admin' });
    }
};
exports.registerAdmin = registerAdmin;
// Admin Login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const admin = await prisma_1.default.admin.findUnique({
            where: { email },
            include: {
                batch: {
                    select: {
                        id: true,
                        batch_name: true,
                        city: {
                            select: {
                                id: true,
                                city_name: true
                            }
                        }
                    }
                }
            }
        });
        if (!admin || !admin.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await (0, password_util_1.comparePassword)(password, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const accessToken = (0, jwt_util_1.generateAccessToken)({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            userType: 'admin',
            ...(admin.batch && admin.batch.city && {
                batchId: admin.batch.id,
                batchName: admin.batch.batch_name,
                cityId: admin.batch.city.id,
                cityName: admin.batch.city.city_name,
            }),
        });
        const refreshToken = (0, jwt_util_1.generateRefreshToken)({
            id: admin.id,
            userType: 'admin',
        });
        await prisma_1.default.admin.update({
            where: { id: admin.id },
            data: { refresh_token: refreshToken },
        });
        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};
exports.loginAdmin = loginAdmin;
// Adding  Referesh Token API
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        const decoded = (0, jwt_util_1.verifyRefreshToken)(refreshToken);
        let user;
        if (decoded.userType === 'admin') {
            user = await prisma_1.default.admin.findUnique({
                where: { id: decoded.id },
            });
        }
        else {
            user = await prisma_1.default.student.findUnique({
                where: { id: decoded.id },
            });
        }
        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }
        const newAccessToken = (0, jwt_util_1.generateAccessToken)({
            id: user.id,
            email: user.email,
            role: decoded.userType === 'admin' ? user.role : 'STUDENT',
            userType: decoded.userType,
        });
        res.json({ accessToken: newAccessToken });
    }
    catch (error) {
        res.status(403).json({ error: 'Invalid refresh token' });
    }
};
exports.refreshToken = refreshToken;
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: "ID token required" });
        }
        // Verify token with Google
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email) {
            return res.status(400).json({ error: "Invalid Google token" });
        }
        const email = payload.email;
        const googleId = payload.sub;
        // Validate email domain
        const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({
                error: emailValidation.error
            });
        }
        // Check if student exists
        const student = await prisma_1.default.student.findUnique({
            where: { email },
            include: {
                city: true,
                batch: true,
            },
        });
        if (!student) {
            return res.status(403).json({
                error: "Student not registered by admin",
            });
        }
        // Update google_id if not set
        if (!student.google_id) {
            await prisma_1.default.student.update({
                where: { id: student.id },
                data: { google_id: googleId },
            });
        }
        const accessToken = (0, jwt_util_1.generateAccessToken)({
            id: student.id,
            email: student.email,
            role: "STUDENT",
            userType: "student",
            // Include batch and city info if available
            ...(student.batch && student.city && {
                batchId: student.batch.id,
                batchName: student.batch.batch_name,
                batchSlug: student.batch.slug,
                cityId: student.city.id,
                cityName: student.city.city_name,
            }),
        });
        const refreshToken = (0, jwt_util_1.generateRefreshToken)({
            id: student.id,
            userType: "student",
        });
        await prisma_1.default.student.update({
            where: { id: student.id },
            data: { refresh_token: refreshToken },
        });
        res.json({
            message: "Google login successful",
            accessToken,
            refreshToken,
            user: {
                id: student.id,
                name: student.name,
                email: student.email,
                username: student.username,
                city: student.city,
                batch: student.batch,
            },
        });
    }
    catch (error) {
        console.error("Google login error:", error);
        res.status(401).json({ error: "Invalid Google token" });
    }
};
exports.googleLogin = googleLogin;
// Student Logout
const logoutStudent = async (req, res) => {
    try {
        // Get student info from middleware
        const studentId = req.student?.id;
        if (studentId) {
            // Clear refresh token from database
            await prisma_1.default.student.update({
                where: { id: studentId },
                data: { refresh_token: null }
            });
        }
        res.json({
            message: "Student logout successful",
            // Refresh token cleared from database
        });
    }
    catch (error) {
        console.error("Student logout error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
};
exports.logoutStudent = logoutStudent;
// Admin Logout
const logoutAdmin = async (req, res) => {
    try {
        // Get admin info from middleware
        const adminId = req.admin?.id;
        if (adminId) {
            // Clear refresh token from database
            await prisma_1.default.admin.update({
                where: { id: adminId },
                data: { refresh_token: null }
            });
        }
        // by removing the token from storage.
        res.json({
            message: "Admin logout successful",
            // Optionally, you could add token blacklisting here if needed
        });
    }
    catch (error) {
        console.error("Admin logout error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
};
exports.logoutAdmin = logoutAdmin;
// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Validate email domain
        const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({
                error: emailValidation.error
            });
        }
        // Check if user exists (student or admin)
        let user = null;
        user = await prisma_1.default.student.findUnique({ where: { email } });
        if (!user) {
            user = await prisma_1.default.admin.findUnique({ where: { email } });
        }
        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.json({
                message: 'If an account with this email exists, an OTP has been sent'
            });
        }
        // Generate and save OTP
        const otp = (0, otp_util_1.generateOTP)();
        console.log(`Generated OTP for ${email}: ${otp}`);
        await (0, otp_util_1.saveOTP)(email, otp);
        console.log('OTP saved to database');
        // Send OTP email
        console.log('Attempting to send OTP email...');
        console.log('Email config:', {
            EMAIL_USER: process.env.EMAIL_USER,
            EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
            EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail'
        });
        await (0, email_util_1.sendOTPEmail)(email, otp);
        console.log('OTP email sent successfully!');
        res.json({
            message: 'OTP sent to your email address',
            otp: otp // Remove this in production!
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};
exports.forgotPassword = forgotPassword;
// Reset Password - Verify OTP and reset password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                error: 'Email, OTP, and new password are required'
            });
        }
        // Validate email domain
        const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({
                error: emailValidation.error
            });
        }
        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }
        // Verify OTP
        const isValidOTP = await (0, otp_util_1.validateOTP)(email, otp);
        if (!isValidOTP) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        // Find user and update password
        let user = null;
        user = await prisma_1.default.student.findUnique({ where: { email } });
        let userType = '';
        if (user) {
            userType = 'student';
        }
        else {
            user = await prisma_1.default.admin.findUnique({ where: { email } });
            if (user) {
                userType = 'admin';
            }
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Hash new password
        const password_hash = await (0, password_util_1.hashPassword)(newPassword);
        // Update password based on user type
        if (userType === 'student') {
            await prisma_1.default.student.update({
                where: { email },
                data: { password_hash }
            });
        }
        else {
            await prisma_1.default.admin.update({
                where: { email },
                data: { password_hash }
            });
        }
        res.json({
            message: 'Password reset successful. You can now login with your new password.'
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
exports.resetPassword = resetPassword;
