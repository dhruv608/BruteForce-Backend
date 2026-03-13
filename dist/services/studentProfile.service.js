"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStudentProfileService = exports.getStudentProfileService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getStudentProfileService = async (studentId) => {
    try {
        // 1️⃣ Get student basic info + leaderboard
        const student = await prisma_1.default.student.findUnique({
            where: { id: studentId },
            include: {
                city: true,
                batch: true,
                leaderboards: true,
                _count: {
                    select: {
                        progress: true
                    }
                }
            }
        });
        if (!student) {
            throw new Error("Student not found");
        }
        // Get batch question counts for all levels
        const batchQuestionCounts = await prisma_1.default.batch.findUnique({
            where: { id: student.batch_id },
            select: {
                easy_assigned: true,
                medium_assigned: true,
                hard_assigned: true
            }
        });
        const leaderboard = student.leaderboards;
        // 2️⃣ Get recent activity
        const recentActivity = await prisma_1.default.studentProgress.findMany({
            where: { student_id: studentId },
            include: {
                question: {
                    select: {
                        question_name: true,
                        level: true
                    }
                }
            },
            orderBy: {
                sync_at: "desc"
            },
            take: 5
        });
        // 3️⃣ Heatmap
        const heatmap = await prisma_1.default.$queryRaw `
      SELECT DATE(sync_at) as date, COUNT(*) as count
      FROM "StudentProgress"
      WHERE student_id = ${studentId}
      GROUP BY DATE(sync_at)
      ORDER BY date DESC
    `;
        return {
            student: {
                name: student.name,
                username: student.username,
                email: student.email,
                enrollmentId: student.enrollment_id,
                city: student.city?.city_name || null,
                batch: student.batch?.batch_name || null,
                year: student.batch?.year || null,
                github: student.github,
                linkedin: student.linkedin,
                leetcode: student.leetcode_id,
                gfg: student.gfg_id
            },
            codingStats: {
                totalSolved: student._count.progress,
                totalAssigned: (batchQuestionCounts?.easy_assigned || 0) + (batchQuestionCounts?.medium_assigned || 0) + (batchQuestionCounts?.hard_assigned || 0),
                easy: {
                    assigned: batchQuestionCounts?.easy_assigned || 0,
                    solved: leaderboard?.easy_solved || 0
                },
                medium: {
                    assigned: batchQuestionCounts?.medium_assigned || 0,
                    solved: leaderboard?.medium_solved || 0
                },
                hard: {
                    assigned: batchQuestionCounts?.hard_assigned || 0,
                    solved: leaderboard?.hard_solved || 0
                }
            },
            streak: {
                currentStreak: leaderboard?.current_streak || 0,
                maxStreak: leaderboard?.max_streak || 0
            },
            leaderboard: {
                globalRank: leaderboard?.alltime_global_rank || 0,
                cityRank: leaderboard?.alltime_city_rank || 0
            },
            heatmap: heatmap.map((h) => ({
                date: h.date,
                count: Number(h.count)
            })),
            recentActivity: recentActivity.map((a) => ({
                problemTitle: a.question.question_name,
                difficulty: a.question.level,
                solvedAt: a.sync_at
            }))
        };
    }
    catch (error) {
        throw new Error("Student profile retrieval failed: " +
            (error instanceof Error ? error.message : String(error)));
    }
};
exports.getStudentProfileService = getStudentProfileService;
const getPublicStudentProfileService = async (username) => {
    const student = await prisma_1.default.student.findUnique({
        where: { username },
        include: {
            city: true,
            batch: true,
            leaderboards: true,
            _count: {
                select: {
                    progress: true
                }
            }
        }
    });
    if (!student) {
        throw new Error("Student not found");
    }
    const studentId = student.id;
    // Get batch question counts for all levels
    const batchQuestionCounts = await prisma_1.default.batch.findUnique({
        where: { id: student.batch_id },
        select: {
            easy_assigned: true,
            medium_assigned: true,
            hard_assigned: true
        }
    });
    const recentActivity = await prisma_1.default.studentProgress.findMany({
        where: { student_id: studentId },
        include: {
            question: {
                select: {
                    question_name: true,
                    level: true
                }
            }
        },
        orderBy: {
            sync_at: "desc"
        },
        take: 5
    });
    const heatmap = await prisma_1.default.$queryRaw `
      SELECT DATE(sync_at) as date, COUNT(*) as count
      FROM "StudentProgress"
      WHERE student_id = ${studentId}
      GROUP BY DATE(sync_at)
      ORDER BY date DESC
    `;
    const leaderboard = student.leaderboards;
    return {
        student: {
            name: student.name,
            username: student.username,
            city: student.city?.city_name || null,
            batch: student.batch?.batch_name || null,
            year: student.batch?.year || null,
            github: student.github,
            linkedin: student.linkedin,
            leetcode: student.leetcode_id,
            gfg: student.gfg_id
        },
        codingStats: {
            totalSolved: student._count.progress,
            totalAssigned: (batchQuestionCounts?.easy_assigned || 0) + (batchQuestionCounts?.medium_assigned || 0) + (batchQuestionCounts?.hard_assigned || 0),
            easy: {
                assigned: batchQuestionCounts?.easy_assigned || 0,
                solved: leaderboard?.easy_solved || 0
            },
            medium: {
                assigned: batchQuestionCounts?.medium_assigned || 0,
                solved: leaderboard?.medium_solved || 0
            },
            hard: {
                assigned: batchQuestionCounts?.hard_assigned || 0,
                solved: leaderboard?.hard_solved || 0
            }
        },
        streak: {
            currentStreak: leaderboard?.current_streak || 0,
            maxStreak: leaderboard?.max_streak || 0
        },
        leaderboard: {
            globalRank: leaderboard?.alltime_global_rank || 0,
            cityRank: leaderboard?.alltime_city_rank || 0
        },
        heatmap: heatmap.map((h) => ({
            date: h.date,
            count: Number(h.count)
        })),
        recentActivity: recentActivity.map((a) => ({
            problemTitle: a.question.question_name,
            difficulty: a.question.level,
            solvedAt: a.sync_at
        }))
    };
};
exports.getPublicStudentProfileService = getPublicStudentProfileService;
