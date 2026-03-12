"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getDashboardService = async (query) => {
    try {
        const { batchSlug, citySlug } = query;
        let batchIds = [];
        if (batchSlug) {
            const batch = await prisma_1.default.batch.findFirst({
                where: {
                    batch_name: batchSlug,
                    city: {
                        city_name: citySlug
                    }
                },
                select: { id: true }
            });
            if (!batch) {
                throw new Error("Batch not found");
            }
            batchIds = [batch.id];
        }
        const [totalCities, totalStudents, assignedQuestions, solvedQuestions] = await Promise.all([
            prisma_1.default.city.count(),
            prisma_1.default.student.count({
                where: {
                    batch_id: batchIds.length ? { in: batchIds } : undefined
                }
            }),
            prisma_1.default.question.findMany({
                where: {
                    visibility: {
                        some: {
                            class: {
                                batch_id: batchIds.length ? { in: batchIds } : undefined
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    platform: true,
                    level: true,
                    type: true
                }
            }),
            prisma_1.default.studentProgress.findMany({
                where: {
                    student: {
                        batch_id: batchIds.length ? { in: batchIds } : undefined
                    }
                },
                include: {
                    question: {
                        select: {
                            platform: true,
                            level: true,
                            type: true
                        }
                    }
                }
            })
        ]);
        // -----------------------------
        // ASSIGNED QUESTION ANALYTICS
        // -----------------------------
        const platformStats = { leetcode: 0, gfg: 0 };
        const difficultyStats = { easy: 0, medium: 0, hard: 0 };
        const typeStats = { homework: 0, classwork: 0 };
        assignedQuestions.forEach(q => {
            if (q.platform === "LEETCODE")
                platformStats.leetcode++;
            if (q.platform === "GFG")
                platformStats.gfg++;
            if (q.level === "EASY")
                difficultyStats.easy++;
            if (q.level === "MEDIUM")
                difficultyStats.medium++;
            if (q.level === "HARD")
                difficultyStats.hard++;
            if (q.type === "HOMEWORK")
                typeStats.homework++;
            if (q.type === "CLASSWORK")
                typeStats.classwork++;
        });
        // -----------------------------
        // SOLVED QUESTION ANALYTICS
        // -----------------------------
        const solvedStats = {
            leetcode: { easy: 0, medium: 0, hard: 0 },
            gfg: { easy: 0, medium: 0, hard: 0 }
        };
        solvedQuestions.forEach(s => {
            const q = s.question;
            const platform = q.platform === "LEETCODE"
                ? "leetcode"
                : q.platform === "GFG"
                    ? "gfg"
                    : null;
            if (!platform)
                return;
            if (q.level === "EASY")
                solvedStats[platform].easy++;
            if (q.level === "MEDIUM")
                solvedStats[platform].medium++;
            if (q.level === "HARD")
                solvedStats[platform].hard++;
        });
        return {
            overview: {
                totalCities,
                totalStudents,
                totalAssignedQuestions: assignedQuestions.length
            },
            assignedQuestions: {
                platforms: platformStats,
                difficulty: difficultyStats,
                type: typeStats
            },
            solvedQuestions: solvedStats
        };
    }
    catch (error) {
        throw new Error("Dashboard data fetch failed");
    }
};
exports.getDashboardService = getDashboardService;
