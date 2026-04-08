"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentStudentService = exports.addStudentProgressService = exports.createStudentService = exports.deleteStudentDetailsService = exports.updateStudentDetailsService = exports.getStudentReportService = exports.getAllStudentsService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const usernameGenerator_1 = require("../utils/usernameGenerator");
const client_1 = require("@prisma/client");
const errorMapper_1 = require("../utils/errorMapper");
const ApiError_1 = require("../utils/ApiError");
// ==============================
// GET ALL STUDENTS
// ==============================
const getAllStudentsService = async (query) => {
    try {
        const { search, city, batchSlug, sortBy = "created_at", order = "desc", page = 1, limit = 10, minGlobalRank, maxGlobalRank, minCityRank, maxCityRank } = query;
        // --- PAGINATION SAFETY ---
        const parsedPage = Math.max(1, Number(page) || 1);
        let parsedLimit = Number(limit) || 10;
        // Cap limit to max 100
        if (parsedLimit > 100) {
            parsedLimit = 100;
        }
        if (parsedLimit < 1) {
            parsedLimit = 10;
        }
        const skip = (parsedPage - 1) * parsedLimit;
        const take = parsedLimit;
        // Check if rank filters are provided
        const hasRankFilters = minGlobalRank || maxGlobalRank || minCityRank || maxCityRank;
        // --- STEP 1: Get student IDs matching rank filters (if any) ---
        let rankFilteredStudentIds = null;
        if (hasRankFilters) {
            const rankConditions = [];
            const rankParams = [];
            let paramIndex = 1;
            if (minGlobalRank) {
                rankConditions.push(`alltime_global_rank >= $${paramIndex}`);
                rankParams.push(Number(minGlobalRank));
                paramIndex++;
            }
            if (maxGlobalRank) {
                rankConditions.push(`alltime_global_rank <= $${paramIndex}`);
                rankParams.push(Number(maxGlobalRank));
                paramIndex++;
            }
            if (minCityRank) {
                rankConditions.push(`alltime_city_rank >= $${paramIndex}`);
                rankParams.push(Number(minCityRank));
                paramIndex++;
            }
            if (maxCityRank) {
                rankConditions.push(`alltime_city_rank <= $${paramIndex}`);
                rankParams.push(Number(maxCityRank));
                paramIndex++;
            }
            const leaderboardFilterQuery = `
                SELECT student_id
                FROM "Leaderboard"
                WHERE ${rankConditions.join(' AND ')}
            `;
            const leaderboardFiltered = await prisma_1.default.$queryRawUnsafe(leaderboardFilterQuery, ...rankParams);
            rankFilteredStudentIds = leaderboardFiltered.map(entry => entry.student_id);
            // Early return if no students match rank filters
            if (rankFilteredStudentIds.length === 0) {
                return {
                    students: [],
                    pagination: {
                        page: parsedPage,
                        limit: take,
                        total: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: parsedPage > 1
                    }
                };
            }
        }
        const where = {};
        // --- APPLY RANK FILTER TO WHERE (if applicable) ---
        if (rankFilteredStudentIds) {
            where.id = { in: rankFilteredStudentIds };
        }
        // search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
                { enrollment_id: { contains: search, mode: "insensitive" } },
            ];
        }
        // city filter
        if (city) {
            where.city = {
                city_name: city,
            };
        }
        // batch filter
        if (batchSlug) {
            where.batch = {
                slug: batchSlug,
            };
        }
        // dynamic sorting
        let orderBy = {
            [sortBy]: order === "asc" ? "asc" : "desc"
        };
        // special case → total solved questions
        if (sortBy === "totalSolved") {
            orderBy = {
                progress: {
                    _count: order === "asc" ? "asc" : "desc"
                }
            };
        }
        // --- STEP 2: Fetch students + count + leaderboard in parallel ---
        const [students, totalCount] = await Promise.all([
            // Get students with pagination
            prisma_1.default.student.findMany({
                where,
                include: {
                    city: true,
                    batch: true,
                    _count: {
                        select: {
                            progress: true
                        }
                    }
                },
                orderBy,
                skip,
                take
            }),
            // Get total count for pagination
            prisma_1.default.student.count({ where })
        ]);
        // Get leaderboard data for the fetched students (PARALLEL)
        const studentIds = students.map(s => s.id);
        let leaderboardData = [];
        if (studentIds.length > 0) {
            leaderboardData = await prisma_1.default.$queryRaw `
                SELECT 
                    student_id,
                    alltime_global_rank as global_rank,
                    alltime_city_rank as city_rank,
                    easy_solved,
                    medium_solved,
                    hard_solved
                FROM "Leaderboard"
                WHERE student_id = ANY(${studentIds}::int[])
            `;
        }
        // Create a map for quick lookup
        const leaderboardMap = new Map(leaderboardData.map(entry => [entry.student_id, entry]));
        // Format response (NO in-memory filtering - all filtering done at DB)
        const formatted = students.map((student) => {
            return {
                id: student.id,
                name: student.name,
                email: student.email,
                username: student.username,
                enrollment_id: student.enrollment_id,
                profile_image_url: student.profile_image_url,
                leetcode_id: student.leetcode_id,
                gfg_id: student.gfg_id,
                totalSolved: student._count.progress
            };
        });
        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / take);
        const hasNextPage = parsedPage < totalPages;
        const hasPreviousPage = parsedPage > 1;
        return {
            students: formatted,
            pagination: {
                page: parsedPage,
                limit: take,
                total: totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage
            }
        };
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                throw new ApiError_1.ApiError(400, "Duplicate entry found", [], "DUPLICATE_ENTRY");
            }
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(404, "Record not found", [], "NOT_FOUND_ERROR");
            }
        }
        throw new ApiError_1.ApiError(500, "Failed to fetch students", [], "SERVER_ERROR");
    }
};
exports.getAllStudentsService = getAllStudentsService;
// ==============================
// GET STUDENT REPORT
// ==============================
const getStudentReportService = async (username) => {
    try {
        const student = await prisma_1.default.student.findUnique({
            where: { username },
            include: {
                city: true,
                batch: true,
                progress: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                platform: true,
                                level: true,
                                topic_id: true,
                                topic: {
                                    select: {
                                        topic_name: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { sync_at: "desc" },
                    take: 5
                }
            }
        });
        if (!student) {
            throw new ApiError_1.ApiError(400, "Student not found");
        }
        const [solvedQuestions, visibilityTypes, batchQuestions, topics] = await Promise.all([
            // solved questions by student
            prisma_1.default.studentProgress.findMany({
                where: { student_id: student.id },
                include: {
                    question: {
                        select: {
                            id: true,
                            platform: true,
                            level: true,
                            topic_id: true
                        }
                    }
                }
            }),
            // get visibility types for solved questions in student's batch
            prisma_1.default.questionVisibility.findMany({
                where: {
                    class: { batch_id: student.batch_id || undefined },
                    question: {
                        progress: {
                            some: { student_id: student.id }
                        }
                    }
                },
                select: {
                    question_id: true,
                    type: true
                }
            }),
            // questions assigned to this batch
            prisma_1.default.question.findMany({
                where: {
                    visibility: {
                        some: {
                            class: {
                                batch_id: student.batch_id || undefined
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    topic_id: true
                }
            }),
            prisma_1.default.topic.findMany({
                select: {
                    id: true,
                    topic_name: true
                }
            })
        ]);
        // ---------- stats calculation ----------
        let totalSolved = solvedQuestions.length;
        // Create visibility type map
        const visibilityTypeMap = new Map(visibilityTypes.map(v => [v.question_id, v.type]));
        const platformStats = {
            leetcode: {
                total: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                homework: 0,
                classwork: 0
            },
            gfg: {
                total: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                homework: 0,
                classwork: 0
            }
        };
        const difficultyStats = {
            easy: 0,
            medium: 0,
            hard: 0
        };
        const typeStats = {
            homework: 0,
            classwork: 0
        };
        const solvedTopicMap = {};
        const totalTopicMap = {};
        // solved stats
        solvedQuestions.forEach(s => {
            const q = s.question;
            const platform = q.platform === "LEETCODE" ? "leetcode" :
                q.platform === "GFG" ? "gfg" : null;
            if (platform) {
                platformStats[platform].total++;
                if (q.level === "EASY")
                    platformStats[platform].easy++;
                if (q.level === "MEDIUM")
                    platformStats[platform].medium++;
                if (q.level === "HARD")
                    platformStats[platform].hard++;
                const qType = visibilityTypeMap.get(q.id) || 'HOMEWORK';
                if (qType === "HOMEWORK")
                    platformStats[platform].homework++;
                if (qType === "CLASSWORK")
                    platformStats[platform].classwork++;
            }
            // existing global stats
            if (q.level === "EASY")
                difficultyStats.easy++;
            if (q.level === "MEDIUM")
                difficultyStats.medium++;
            if (q.level === "HARD")
                difficultyStats.hard++;
            const qType2 = visibilityTypeMap.get(q.id) || 'HOMEWORK';
            if (qType2 === "HOMEWORK")
                typeStats.homework++;
            if (qType2 === "CLASSWORK")
                typeStats.classwork++;
            solvedTopicMap[q.topic_id] =
                (solvedTopicMap[q.topic_id] || 0) + 1;
        });
        // total questions per topic
        batchQuestions.forEach(q => {
            totalTopicMap[q.topic_id] =
                (totalTopicMap[q.topic_id] || 0) + 1;
        });
        const topicStats = Object.keys(totalTopicMap).map(topicId => {
            const topic = topics.find(t => t.id === Number(topicId));
            return {
                topic: topic?.topic_name || "Unknown",
                totalQuestions: totalTopicMap[Number(topicId)],
                solvedByStudent: solvedTopicMap[Number(topicId)] || 0
            };
        });
        return {
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                city: student.city?.city_name,
                batch: {
                    batch_name: student.batch?.batch_name,
                    year: student.batch?.year
                },
                created_at: student.created_at
            },
            stats: {
                totalSolved,
                platforms: platformStats,
                difficulty: difficultyStats,
                type: typeStats,
                topicStats
            },
            recentActivity: student.progress
        };
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(404, "Student not found");
            }
        }
        throw new ApiError_1.ApiError(500, "Failed to fetch student report");
    }
};
exports.getStudentReportService = getStudentReportService;
// UPDATE STUDENT
// ==============================
const updateStudentDetailsService = async (id, body) => {
    try {
        const student = await prisma_1.default.student.findUnique({
            where: { id }
        });
        if (!student) {
            throw new ApiError_1.ApiError(400, "Student not found");
        }
        const updateData = { ...body };
        const updatedStudent = await prisma_1.default.student.update({
            where: { id },
            data: updateData
        });
        return updatedStudent;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Student not found");
            }
            if (error.code === "P2002") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Email, Username or Enrollment ID already exists");
            }
            if (error.code === "P2003") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.BAD_REQUEST, "Invalid city or batch reference");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update student");
    }
};
exports.updateStudentDetailsService = updateStudentDetailsService;
// DELETE STUDENT
const deleteStudentDetailsService = async (id) => {
    try {
        const student = await prisma_1.default.student.findUnique({
            where: { id }
        });
        if (!student) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Student not found");
        }
        await prisma_1.default.student.delete({
            where: { id }
        });
        return true;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Student not found");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete student");
    }
};
exports.deleteStudentDetailsService = deleteStudentDetailsService;
// CREATE STUDENT
const createStudentService = async (data) => {
    try {
        const { name, email, username, password, enrollment_id, batch_id, leetcode_id, gfg_id } = data;
        // Only require name and email, username will be generated if not provided
        if (!name || !email) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.BAD_REQUEST, "Name and email are required");
        }
        // Generate username if not provided
        let finalUsername = username;
        if (!finalUsername) {
            const usernameResult = await (0, usernameGenerator_1.generateUsername)(name, enrollment_id);
            finalUsername = usernameResult.finalUsername;
        }
        // batch exist check karo
        const batch = await prisma_1.default.batch.findUnique({
            where: { id: batch_id },
            select: {
                id: true,
                city_id: true
            }
        });
        if (!batch) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Batch not found");
        }
        let password_hash = null;
        if (password) {
            password_hash = await bcryptjs_1.default.hash(password, 10);
        }
        const student = await prisma_1.default.student.create({
            data: {
                name,
                email,
                username: finalUsername,
                password_hash,
                enrollment_id,
                batch_id,
                city_id: batch.city_id, // city automatically batch se
                leetcode_id,
                gfg_id
            }
        });
        return student;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                const field = error.meta?.target;
                if (field?.includes("email"))
                    throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Email already exists", [], "EMAIL_ALREADY_EXISTS");
                if (field?.includes("username"))
                    throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Username already exists");
                if (field?.includes("enrollment_id"))
                    throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Enrollment ID already exists");
                if (field?.includes("google_id"))
                    throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Google account already linked");
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Duplicate field detected");
            }
            if (error.code === "P2003") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.BAD_REQUEST, "Invalid batch reference");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create student");
    }
};
exports.createStudentService = createStudentService;
const addStudentProgressService = async (student_id, question_id) => {
    try {
        // check student
        const student = await prisma_1.default.student.findUnique({
            where: { id: student_id }
        });
        if (!student) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Student not found");
        }
        // check question
        const question = await prisma_1.default.question.findUnique({
            where: { id: question_id }
        });
        if (!question) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Question not found");
        }
        // create progress
        const progress = await prisma_1.default.studentProgress.create({
            data: {
                student_id,
                question_id
            }
        });
        return progress;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // duplicate solved question
            if (error.code === "P2002") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Student already solved this question");
            }
            // foreign key error
            if (error.code === "P2003") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.BAD_REQUEST, "Invalid student or question reference");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to add student progress");
    }
};
exports.addStudentProgressService = addStudentProgressService;
const getCurrentStudentService = async (studentId) => {
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            name: true,
            username: true,
            city: {
                select: {
                    id: true,
                    city_name: true
                }
            },
            batch: {
                select: {
                    id: true,
                    batch_name: true,
                    year: true
                }
            },
            email: true,
            profile_image_url: true,
            leetcode_id: true,
            gfg_id: true
        }
    });
    if (!student) {
        throw new ApiError_1.ApiError(404, "Student not found", [], "STUDENT_NOT_FOUND");
    }
    return student;
};
exports.getCurrentStudentService = getCurrentStudentService;
