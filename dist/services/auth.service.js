"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOTP = exports.sendPasswordResetOTP = exports.logoutAdmin = exports.logoutStudent = exports.googleAuth = exports.refreshAccessToken = exports.loginAdmin = exports.loginStudent = exports.registerStudent = exports.registerAdmin = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const admin_service_1 = require("./admin.service");
const password_util_1 = require("../utils/password.util");
const jwt_util_1 = require("../utils/jwt.util");
const google_auth_library_1 = require("google-auth-library");
const otp_util_1 = require("../utils/otp.util");
const email_util_1 = require("../utils/email.util");
const emailValidation_util_1 = require("../utils/emailValidation.util");
const passwordValidator_util_1 = require("../utils/passwordValidator.util");
const ApiError_1 = require("../utils/ApiError");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
const registerAdmin = async (data) => {
    const { currentUserRole, ...adminData } = data;
    // Only SUPERADMIN can create admins
    if (currentUserRole !== 'SUPERADMIN') {
        throw new ApiError_1.ApiError(403, 'Only Super Admin can register new admins', [], "FORBIDDEN");
    }
    // Create admin using the existing service
    const admin = await (0, admin_service_1.createAdminService)(adminData);
    // Generate tokens
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
    // Update refresh token in database
    await prisma_1.default.admin.update({
        where: { id: admin.id },
        data: { refresh_token: refreshToken },
    });
    return {
        user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        },
        accessToken,
        refreshToken
    };
};
exports.registerAdmin = registerAdmin;
const registerStudent = async (data) => {
    const { name, email, username, password, enrollment_id, batch_id, leetcode_id, gfg_id } = data;
    // Validation
    if (!name || !email || !username || !password || !batch_id) {
        throw new ApiError_1.ApiError(400, 'Name, email, username, password, and batch_id are required', [], "REQUIRED_FIELD");
    }
    // Validate email domain
    const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
    if (!emailValidation.isValid) {
        throw new ApiError_1.ApiError(400, emailValidation.error, [], "INVALID_EMAIL");
    }
    // Check existing user
    const existingStudent = await prisma_1.default.student.findFirst({
        where: {
            OR: [{ email }, { username }, { enrollment_id }],
        },
    });
    if (existingStudent) {
        throw new ApiError_1.ApiError(400, 'Email, username, or enrollment_id already exists', [], "USER_EXISTS");
    }
    // Get batch information to fetch city_id
    const batch = await prisma_1.default.batch.findUnique({
        where: { id: batch_id },
        include: { city: true }
    });
    if (!batch) {
        throw new ApiError_1.ApiError(400, 'Invalid batch_id', [], "BATCH_NOT_FOUND");
    }
    // Validate password strength
    (0, passwordValidator_util_1.validatePasswordForAuth)(password);
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
            city_id: batch.city_id,
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
    return student;
};
exports.registerStudent = registerStudent;
const loginStudent = async (credentials) => {
    const { email, username, password } = credentials;
    if ((!email && !username) || !password) {
        throw new ApiError_1.ApiError(400, 'Either email or username with password are required');
    }
    // Validate email domain if email is provided
    if (email) {
        const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
        if (!emailValidation.isValid) {
            throw new ApiError_1.ApiError(400, emailValidation.error);
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
        throw new ApiError_1.ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
    }
    // Compare password
    const isValidPassword = await (0, password_util_1.comparePassword)(password, student.password_hash);
    if (!isValidPassword) {
        throw new ApiError_1.ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
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
    // Update refresh token in database
    await prisma_1.default.student.update({
        where: { id: student.id },
        data: { refresh_token: refreshToken },
    });
    return {
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
        accessToken,
        refreshToken
    };
};
exports.loginStudent = loginStudent;
const loginAdmin = async (credentials) => {
    const { email, password } = credentials;
    if (!email || !password) {
        throw new ApiError_1.ApiError(400, 'Email and password are required');
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
        throw new ApiError_1.ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
    }
    const isValidPassword = await (0, password_util_1.comparePassword)(password, admin.password_hash);
    if (!isValidPassword) {
        throw new ApiError_1.ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
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
    // Update refresh token in database
    await prisma_1.default.admin.update({
        where: { id: admin.id },
        data: { refresh_token: refreshToken },
    });
    return {
        user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        },
        accessToken,
        refreshToken
    };
};
exports.loginAdmin = loginAdmin;
const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError_1.ApiError(400, 'Refresh token required');
    }
    const decoded = (0, jwt_util_1.verifyRefreshToken)(refreshToken);
    let user;
    if (decoded.userType === 'admin') {
        user = await prisma_1.default.admin.findUnique({
            where: { id: decoded.id },
            include: {
                batch: {
                    select: { id: true, batch_name: true, city: { select: { id: true, city_name: true } } }
                }
            }
        });
    }
    else {
        user = await prisma_1.default.student.findUnique({
            where: { id: decoded.id },
            include: {
                batch: true,
                city: true
            }
        });
    }
    if (!user || user.refresh_token !== refreshToken) {
        throw new ApiError_1.ApiError(403, 'Invalid refresh token', [], "INVALID_TOKEN");
    }
    const newAccessToken = (0, jwt_util_1.generateAccessToken)({
        id: user.id,
        email: user.email,
        role: decoded.userType === 'admin' ? user.role : 'STUDENT',
        userType: decoded.userType,
        ...(user.batch && decoded.userType === 'admin' && user.batch.city && {
            batchId: user.batch.id,
            batchName: user.batch.batch_name,
            cityId: user.batch.city.id,
            cityName: user.batch.city.city_name,
        }),
        ...(user.batch && decoded.userType === 'student' && user.city && {
            batchId: user.batch.id,
            batchName: user.batch.batch_name,
            batchSlug: user.batch.slug,
            cityId: user.city.id,
            cityName: user.city.city_name,
        }),
    });
    return { accessToken: newAccessToken };
};
exports.refreshAccessToken = refreshAccessToken;
const googleAuth = async (idToken) => {
    if (!idToken) {
        throw new ApiError_1.ApiError(400, "ID token required");
    }
    // Verify token with Google
    async function verifyIdToken(idToken) {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            return payload;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            console.error("Google Auth Library verifyIdToken Error:", error.message);
            throw new ApiError_1.ApiError(400, 'Failed to verify Google token: ' + error.message);
        }
    }
    const payload = await verifyIdToken(idToken);
    if (!payload?.email) {
        throw new ApiError_1.ApiError(400, "Invalid Google token");
    }
    const email = payload.email;
    const googleId = payload.sub;
    // Validate email domain
    const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
    if (!emailValidation.isValid) {
        throw new ApiError_1.ApiError(400, emailValidation.error);
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
        throw new ApiError_1.ApiError(422, "Student not registered by admin", [], "STUDENT_NOT_REGISTERED");
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
    // Update refresh token in database
    await prisma_1.default.student.update({
        where: { id: student.id },
        data: { refresh_token: refreshToken },
    });
    return {
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
        accessToken,
        refreshToken
    };
};
exports.googleAuth = googleAuth;
const logoutStudent = async (studentId) => {
    if (studentId) {
        await prisma_1.default.student.update({
            where: { id: studentId },
            data: { refresh_token: null }
        });
    }
};
exports.logoutStudent = logoutStudent;
const logoutAdmin = async (adminId) => {
    if (adminId) {
        await prisma_1.default.admin.update({
            where: { id: adminId },
            data: { refresh_token: null }
        });
    }
};
exports.logoutAdmin = logoutAdmin;
const sendPasswordResetOTP = async (email) => {
    if (!email) {
        throw new ApiError_1.ApiError(400, 'Email is required');
    }
    // Validate email domain
    const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
    if (!emailValidation.isValid) {
        throw new ApiError_1.ApiError(400, emailValidation.error);
    }
    // Check if user exists (student or admin)
    let user = null;
    user = await prisma_1.default.student.findUnique({ where: { email } });
    if (!user) {
        user = await prisma_1.default.admin.findUnique({ where: { email } });
    }
    if (!user) {
        throw new ApiError_1.ApiError(404, 'No account found with this email address');
    }
    // Generate and save OTP
    const otp = (0, otp_util_1.generateOTP)();
    console.log(`Generated OTP for ${email}: ${otp}`);
    await (0, otp_util_1.saveOTP)(email, otp);
    console.log('OTP saved to database');
    // Send OTP email
    console.log('Attempting to send OTP email...');
    await (0, email_util_1.sendOTPEmail)(email, otp, user?.name);
    console.log('OTP email sent successfully!');
    return {
        message: 'OTP sent to your email address',
        otp // Return OTP for testing
    };
};
exports.sendPasswordResetOTP = sendPasswordResetOTP;
const verifyOTP = async (email, otp) => {
    if (!email || !otp) {
        throw new ApiError_1.ApiError(400, 'Email and OTP are required');
    }
    // Validate email domain
    const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
    if (!emailValidation.isValid) {
        throw new ApiError_1.ApiError(400, emailValidation.error);
    }
    // Verify OTP
    console.log(`Attempting to validate OTP: ${otp} for email: ${email}`);
    const isValidOTP = await (0, otp_util_1.validateOTP)(email, otp);
    console.log(`OTP validation result: ${isValidOTP}`);
    if (!isValidOTP) {
        throw new ApiError_1.ApiError(400, 'Invalid or expired OTP');
    }
    return {
        message: 'OTP verified successfully',
        valid: true
    };
};
exports.verifyOTP = verifyOTP;
const resetPassword = async (email, otp, newPassword) => {
    if (!email || !otp || !newPassword) {
        throw new ApiError_1.ApiError(400, 'Email, OTP, and new password are required');
    }
    // Validate email domain
    const emailValidation = (0, emailValidation_util_1.validateEmail)(email);
    if (!emailValidation.isValid) {
        throw new ApiError_1.ApiError(400, emailValidation.error);
    }
    // Validate password strength
    (0, passwordValidator_util_1.validatePasswordForAuth)(newPassword);
    // Verify OTP
    console.log(`Attempting to validate OTP: ${otp} for email: ${email}`);
    const isValidOTP = await (0, otp_util_1.validateOTP)(email, otp);
    console.log(`OTP validation result: ${isValidOTP}`);
    if (!isValidOTP) {
        throw new ApiError_1.ApiError(400, 'Invalid or expired OTP');
    }
    // Mark OTP as used
    await prisma_1.default.passwordResetOTP.updateMany({
        where: {
            email,
            is_used: false
        },
        data: { is_used: true }
    });
    // Find user
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
        throw new ApiError_1.ApiError(404, 'User not found');
    }
    // Check if new password is same as current password
    if (user.password_hash) {
        const isSamePassword = await (0, password_util_1.comparePassword)(newPassword, user.password_hash);
        if (isSamePassword) {
            throw new ApiError_1.ApiError(400, 'New password cannot be the same as your current password');
        }
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
    return {
        message: 'Password reset successful. You can now login with your new password.'
    };
};
exports.resetPassword = resetPassword;
