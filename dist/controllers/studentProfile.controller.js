"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStudentProfile = exports.getStudentProfile = void 0;
const studentProfile_service_1 = require("../services/studentProfile.service");
const getStudentProfile = async (req, res) => {
    try {
        const studentId = req.user?.id;
        if (!studentId) {
            return res.status(401).json({ error: "Student ID not found" });
        }
        const profile = await (0, studentProfile_service_1.getStudentProfileService)(studentId);
        res.json(profile);
    }
    catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to get student profile"
        });
    }
};
exports.getStudentProfile = getStudentProfile;
const getPublicStudentProfile = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username || Array.isArray(username)) {
            return res.status(400).json({ error: "Username is required" });
        }
        const profile = await (0, studentProfile_service_1.getPublicStudentProfileService)(username);
        res.json(profile);
    }
    catch (error) {
        console.error("Public profile error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to get public student profile"
        });
    }
};
exports.getPublicStudentProfile = getPublicStudentProfile;
