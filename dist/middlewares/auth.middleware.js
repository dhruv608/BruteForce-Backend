"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const ApiError_1 = require("../utils/ApiError");
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Auth Header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError_1.ApiError(401, "No token provided");
    }
    const token = authHeader.split(" ")[1];
    console.log("Token:", token);
    console.log("ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);
    try {
        const decoded = (0, jwt_util_1.verifyAccessToken)(token);
        console.log("Decoded:", decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("Token verification error:", error);
        throw new ApiError_1.ApiError(401, "Invalid token");
    }
};
exports.verifyToken = verifyToken;
