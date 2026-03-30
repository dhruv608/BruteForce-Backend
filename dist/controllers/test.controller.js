"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testLeetcode = testLeetcode;
exports.testGfg = testGfg;
const leetcode_service_1 = require("../services/leetcode.service");
const gfg_service_1 = require("../services/gfg.service");
const ApiError_1 = require("../utils/ApiError");
async function testLeetcode(req, res) {
    try {
        const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
        const data = await (0, leetcode_service_1.fetchLeetcodeData)(username);
        return res.json(data);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        return res.status(500).json({
            message: error.message
        });
    }
}
async function testGfg(req, res) {
    try {
        const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
        const data = await (0, gfg_service_1.fetchGfgData)(username);
        return res.json(data);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        return res.status(500).json({
            message: error.message
        });
    }
}
