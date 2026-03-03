import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { isAdmin, isTeacherOrAbove } from "../middlewares/role.middleware";
import { resolveBatch } from "../middlewares/batch.middleware";

// Global Controllers
import { getAllCities } from "../controllers/admin/city.controller";
import { getAllTopics, createTopic, updateTopic, deleteTopic } from "../controllers/admin/topic.controller";
import { createBatch, getAllBatches } from "../controllers/admin/batch.controller";
import { createTopicsBulk }  from "../controllers/admin/topic.controller"
// Workspace Controllers (inside same files)
// import { getWorkspaceOverview, getBatchAnalytics, getLeaderboard } from "../controllers/admin/analytics.controller";

import { getTopicsForBatch } from "../controllers/admin/topic.controller";

import {
  createClassInTopic,
  getClassesByTopic,
  getClassDetails,
  updateClass,
  deleteClass,
} from "../controllers/admin/class.controller";

import { assignQuestions, getAllQuestions, removeQuestionFromClass } from "../controllers/admin/question.controller";

// import {
//   getStudentsForBatch,
//   getStudentReport,
// } from "../controllers/admin/student.controller";

const router = Router();

/* ==========================================
    GLOBAL PROTECTION
========================================== */

router.use(verifyToken);
router.use(isAdmin);

/* ==========================================
   GLOBAL ROUTES (NO BATCH CONTEXT)
========================================== */

// Cities
router.get("/cities", getAllCities);

// Batches
router.post("/batches", createBatch);
router.get("/batches", getAllBatches);

// Global Topics
router.get("/topics", getAllTopics);
router.post("/topics", isTeacherOrAbove, createTopic);
router.patch("/topics/:id", isTeacherOrAbove, updateTopic);
router.delete("/topics/:id", isTeacherOrAbove, deleteTopic);
router.post(  "/topics/bulk",  isTeacherOrAbove,  createTopicsBulk);
/* ==========================================
   WORKSPACE ROUTES (BATCH CONTEXT)
========================================= */

// Everything below requires valid batchSlug
router.use("/:batchSlug", resolveBatch);

/* ---------- Overview ---------- */

// router.get("/:batchSlug/overview", getWorkspaceOverview);

/* ---------- Topics ---------- */

router.get("/:batchSlug/topics", getTopicsForBatch);

/* ---------- Classes (Topic Driven) ---------- */

// List classes of a topic
router.get(
  "/:batchSlug/topics/:topicSlug/classes",
  getClassesByTopic
);
// Create class under topic
router.post(
  "/:batchSlug/topics/:topicSlug/classes",
  isTeacherOrAbove,
  createClassInTopic
);
// Get single class (independent of topic in URL)
router.get(
  "/:batchSlug/classes/:classSlug",
  getClassDetails
);

router.patch(
  "/:batchSlug/classes/:classSlug",
  isTeacherOrAbove,
  updateClass
);

router.delete(
  "/:batchSlug/classes/:classSlug",
  isTeacherOrAbove,
  deleteClass
);

/* ---------- Assign Questions ---------- */


router.get("/questions", getAllQuestions);


router.post(
  "/:batchSlug/classes/:classSlug/questions",
  isTeacherOrAbove,
  assignQuestions
);

router.delete(
  "/:batchSlug/classes/:classSlug/questions/:questionId",
  isTeacherOrAbove,
  removeQuestionFromClass
);


/* ---------- Students ---------- */

// router.get("/:batchSlug/students", getStudentsForBatch);
// router.get("/:batchSlug/students/:studentId", getStudentReport);

// /* ---------- Analytics ---------- */

// router.get("/:batchSlug/analytics", getBatchAnalytics);
// router.get("/:batchSlug/leaderboard", getLeaderboard);

export default router;