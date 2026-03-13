"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredOTPs = exports.validateOTP = exports.saveOTP = exports.verifyOTP = exports.generateOTPHash = exports.generateOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../config/prisma"));
// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
// Generate OTP hash for secure storage
const generateOTPHash = (otp) => {
    return crypto_1.default.createHash('sha256').update(otp).digest('hex');
};
exports.generateOTPHash = generateOTPHash;
// Verify OTP
const verifyOTP = (inputOTP, storedOTPHash) => {
    const inputOTPHash = (0, exports.generateOTPHash)(inputOTP);
    return inputOTPHash === storedOTPHash;
};
exports.verifyOTP = verifyOTP;
// Save OTP to database
const saveOTP = async (email, otp) => {
    // Mark any existing OTPs for this email as used
    await prisma_1.default.passwordResetOTP.updateMany({
        where: { email },
        data: { is_used: true }
    });
    // Save new OTP
    const otpHash = (0, exports.generateOTPHash)(otp);
    await prisma_1.default.passwordResetOTP.create({
        data: {
            email,
            otp: otpHash,
            expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
    });
};
exports.saveOTP = saveOTP;
// Validate OTP from database
const validateOTP = async (email, inputOTP) => {
    const otpRecord = await prisma_1.default.passwordResetOTP.findFirst({
        where: {
            email,
            is_used: false,
            expires_at: {
                gt: new Date()
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    if (!otpRecord) {
        return false;
    }
    const isValid = (0, exports.verifyOTP)(inputOTP, otpRecord.otp);
    if (isValid) {
        // Mark OTP as used
        await prisma_1.default.passwordResetOTP.update({
            where: { id: otpRecord.id },
            data: { is_used: true }
        });
    }
    return isValid;
};
exports.validateOTP = validateOTP;
// Clean up expired OTPs (can be called by a cron job)
const cleanupExpiredOTPs = async () => {
    await prisma_1.default.passwordResetOTP.deleteMany({
        where: {
            expires_at: {
                lt: new Date()
            }
        }
    });
};
exports.cleanupExpiredOTPs = cleanupExpiredOTPs;
