"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignedQuestionsService = exports.deleteQuestionService = exports.updateQuestionService = exports.getAllQuestionsService = exports.createQuestionService = exports.detectPlatform = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
const detectPlatform = (link) => {
    const normalized = link.toLowerCase();
    if (normalized.includes("leetcode.com"))
        return client_1.Platform.LEETCODE;
    if (normalized.includes("geeksforgeeks.org"))
        return client_1.Platform.GFG;
    if (normalized.includes("interviewbit.com"))
        return client_1.Platform.INTERVIEWBIT;
    return client_1.Platform.OTHER;
};
exports.detectPlatform = detectPlatform;
const createQuestionService = async ({ question_name, question_link, topic_id, platform, level = "MEDIUM", }) => {
    if (!question_name || !question_link || !topic_id) {
        throw new ApiError_1.ApiError(400, "All required fields must be provided");
    }
    // Validate topic
    const topic = await prisma_1.default.topic.findUnique({
        where: { id: topic_id },
    });
    if (!topic) {
        throw new ApiError_1.ApiError(400, "Topic not found");
    }
    // Auto detect platform if not provided
    const finalPlatform = platform ?? (0, exports.detectPlatform)(question_link);
    // Prevent duplicate question link (must be unique across all topics)
    const duplicate = await prisma_1.default.question.findFirst({
        where: {
            question_link,
        },
    });
    if (duplicate) {
        throw new ApiError_1.ApiError(400, "Question link already exists", [], "QUESTION_LINK_EXISTS");
    }
    const question = await prisma_1.default.question.create({
        data: {
            question_name,
            question_link,
            topic_id,
            platform: finalPlatform,
            level,
        },
    });
    return question;
};
exports.createQuestionService = createQuestionService;
const getAllQuestionsService = async ({ topicSlug, level, platform, search, page = 1, limit = 10, }) => {
    const where = {};
    //  Pagination safety - enforce max limit
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * validatedLimit;
    //  Topic filter (using relation filter instead of separate query)
    if (topicSlug && topicSlug !== 'all') {
        where.topic = { slug: topicSlug };
    }
    //  Level filter
    if (level) {
        where.level = level;
    }
    //  Platform filter
    if (platform) {
        where.platform = platform;
    }
    //  Search filter
    if (search) {
        where.question_name = {
            contains: search,
            mode: "insensitive",
        };
    }
    const [questions, total] = await prisma_1.default.$transaction([
        prisma_1.default.question.findMany({
            where,
            include: {
                topic: {
                    select: {
                        topic_name: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
            skip,
            take: validatedLimit,
        }),
        prisma_1.default.question.count({ where }),
    ]);
    // 🔎 Validate topic exists if topic filter was applied but no results
    if (topicSlug && topicSlug !== 'all' && questions.length === 0) {
        const topicExists = await prisma_1.default.topic.count({
            where: { slug: topicSlug },
            take: 1,
        });
        if (topicExists === 0) {
            throw new ApiError_1.ApiError(400, "Topic not found");
        }
    }
    return {
        data: questions,
        pagination: {
            total,
            page,
            limit: validatedLimit,
            totalPages: Math.ceil(total / validatedLimit),
        },
    };
};
exports.getAllQuestionsService = getAllQuestionsService;
const updateQuestionService = async ({ id, question_name, question_link, topic_id, level, platform, }) => {
    const existing = await prisma_1.default.question.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new ApiError_1.ApiError(400, "Question not found");
    }
    const finalTopicId = topic_id ?? existing.topic_id;
    // Validate topic if changed
    if (topic_id) {
        const topic = await prisma_1.default.topic.findUnique({
            where: { id: topic_id },
        });
        if (!topic) {
            throw new ApiError_1.ApiError(400, "Topic not found");
        }
    }
    const finalLink = question_link ?? existing.question_link;
    // Prevent duplicate link (must be unique across all topics)
    const duplicate = await prisma_1.default.question.findFirst({
        where: {
            question_link: finalLink,
            NOT: { id: existing.id },
        },
    });
    if (duplicate) {
        throw new ApiError_1.ApiError(400, "Question link already exists", [], "QUESTION_LINK_EXISTS");
    }
    const updated = await prisma_1.default.question.update({
        where: { id },
        data: {
            question_name: question_name ?? existing.question_name,
            question_link: finalLink,
            topic_id: finalTopicId,
            level: level ?? existing.level,
            platform: platform ?? existing.platform,
        },
    });
    return updated;
};
exports.updateQuestionService = updateQuestionService;
const deleteQuestionService = async ({ id, }) => {
    const existing = await prisma_1.default.question.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new ApiError_1.ApiError(400, "Question not found");
    }
    const visibilityCount = await prisma_1.default.questionVisibility.count({
        where: { question_id: id },
    });
    if (visibilityCount > 0) {
        throw new ApiError_1.ApiError(400, "Cannot delete question assigned to classes");
    }
    const progressCount = await prisma_1.default.studentProgress.count({
        where: { question_id: id },
    });
    if (progressCount > 0) {
        throw new ApiError_1.ApiError(400, "Cannot delete question with student progress");
    }
    await prisma_1.default.question.delete({
        where: { id },
    });
    return true;
};
exports.deleteQuestionService = deleteQuestionService;
const getAssignedQuestionsService = async (query) => {
    try {
        const { city, batch, year } = query;
        const batchFilter = {};
        // -----------------------------
        // CITY FILTER
        // -----------------------------
        if (city) {
            const cityExists = await prisma_1.default.city.findUnique({
                where: { city_name: city }
            });
            if (!cityExists) {
                throw new ApiError_1.ApiError(400, "Invalid city");
            }
            batchFilter.city = {
                city_name: city
            };
        }
        // -----------------------------
        // BATCH FILTER
        // -----------------------------
        if (batch) {
            const batchExists = await prisma_1.default.batch.findUnique({
                where: {
                    slug: batch
                }
            });
            if (!batchExists) {
                throw new ApiError_1.ApiError(400, "Invalid batch");
            }
            batchFilter.batch_name = batch;
        }
        // -----------------------------
        // YEAR FILTER
        // -----------------------------
        if (year) {
            const parsedYear = Number(year);
            if (isNaN(parsedYear)) {
                throw new ApiError_1.ApiError(400, "Year must be a number");
            }
            batchFilter.year = parsedYear;
        }
        // -----------------------------
        // FETCH BATCHES
        // -----------------------------
        const batches = await prisma_1.default.batch.findMany({
            where: batchFilter,
            select: { id: true }
        });
        if (batch && batches.length === 0) {
            throw new ApiError_1.ApiError(400, "Batch not found");
        }
        const batchIds = batches.map(b => b.id);
        // -----------------------------
        // FETCH ASSIGNED QUESTIONS
        // -----------------------------
        const questions = await prisma_1.default.question.findMany({
            where: {
                visibility: {
                    some: {
                        class: {
                            batch_id: {
                                in: batchIds.length ? batchIds : undefined
                            }
                        }
                    }
                }
            },
            select: {
                id: true,
                question_name: true,
                platform: true,
                level: true,
                topic: {
                    select: {
                        topic_name: true
                    }
                }
            }
        });
        // -----------------------------
        // ANALYTICS
        // -----------------------------
        const platformStats = { leetcode: 0, gfg: 0 };
        const difficultyStats = { easy: 0, medium: 0, hard: 0 };
        questions.forEach(q => {
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
        });
        return {
            totalQuestions: questions.length,
            analytics: {
                platforms: platformStats,
                difficulty: difficultyStats,
            },
            questions
        };
    }
    catch (error) {
        throw new ApiError_1.ApiError(400, "Failed to fetch assigned questions");
    }
};
exports.getAssignedQuestionsService = getAssignedQuestionsService;
