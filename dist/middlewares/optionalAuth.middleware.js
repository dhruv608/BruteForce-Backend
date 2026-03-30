"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const optionalAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        // No token provided, continue without authentication
        return next();
    }
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user from database
        const user = await prisma_1.default.student.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true
            }
        });
        if (!user) {
            // Invalid token, continue without authentication
            return next();
        }
        // Attach user to request with same structure as other middleware
        req.user = user;
        next();
    }
    catch (error) {
        // Invalid token, continue without authentication
        next();
    }
};
exports.optionalAuth = optionalAuth;
