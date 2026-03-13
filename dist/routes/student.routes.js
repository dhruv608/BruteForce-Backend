"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const student_middleware_1 = require("../middlewares/student.middleware");
const topic_controller_1 = require("../controllers/topic.controller");
const class_controller_1 = require("../controllers/class.controller");
const questionVisibility_controller_1 = require("../controllers/questionVisibility.controller");
const leaderboard_controller_1 = require("../controllers/leaderboard.controller");
const studentProfile_controller_1 = require("../controllers/studentProfile.controller");
const router = (0, express_1.Router)();
// Public route - no authentication required
router.get("/profile/:username", studentProfile_controller_1.getPublicStudentProfile); // Public student profile by username
// All routes require authentication + STUDENT role + student info extraction
router.use(auth_middleware_1.verifyToken, role_middleware_1.isStudent, student_middleware_1.extractStudentInfo);
// ===== TOPICS ROUTES =====
router.get("/topics", topic_controller_1.getTopicsWithBatchProgress); // All topics with batch-specific classes, total questions per batch, and topic-specific solved question count (frontend will calculate progress percentage)
router.get("/topics/:topicSlug", topic_controller_1.getTopicOverviewWithClassesSummary); // Topic overview with classes summary (name, duration, totalQuestions, solvedQuestions)
// ===== CLASSES ROUTES =====
router.get("/topics/:topicSlug/classes/:classSlug", class_controller_1.getClassDetailsWithFullQuestions); // Class details with full questions array & progress
// ===== Global  QUESTIONS ROUTES =====
router.get("/addedQuestions", questionVisibility_controller_1.getAllQuestionsWithFilters); // All questions with filters and solved status
// ===== LEADERBOARD ROUTES =====
router.post("/leaderboard", leaderboard_controller_1.getStudentLeaderboard); // Single student leaderboard with top 10 and personal rank
router.get("/profile", studentProfile_controller_1.getStudentProfile); // Complete student profile with all sections
// router.get("/test/basic", testStudentBasicInfo);
// router.get("/test/stats", testCodingStats);
// router.get("/test/streak", testStreak);
// router.get("/test/leaderboard", testLeaderboard);
// router.get("/test/heatmap", testHeatmap);
// router.get("/test/topic", testTopicProgress);
// router.get("/test/activity", testRecentActivity);
exports.default = router;
