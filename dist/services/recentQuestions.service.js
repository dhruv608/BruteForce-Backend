"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentQuestionsService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getRecentQuestionsService = async ({ batchId, date }) => {
    // Calculate date range for the specific date
    let startDate;
    let endDate;
    if (date) {
        // Parse the provided date (YYYY-MM-DD format)
        const parsedDate = new Date(date + 'T00:00:00.000Z');
        startDate = new Date(parsedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(parsedDate);
        endDate.setHours(23, 59, 59, 999);
    }
    else {
        // Default to today if no date provided
        const today = new Date();
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    }
    // Get questions assigned for this specific date
    const recentQuestions = await prisma_1.default.questionVisibility.findMany({
        where: {
            class: {
                batch_id: batchId
            },
            assigned_at: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            question: {
                include: {
                    topic: {
                        select: {
                            slug: true
                        }
                    }
                }
            },
            class: {
                select: {
                    slug: true
                }
            }
        },
        orderBy: {
            assigned_at: 'desc'
        },
        distinct: ['question_id'] // Avoid duplicate questions
    });
    // Format response
    return recentQuestions.map((qv) => ({
        question_id: qv.question.id,
        question_name: qv.question.question_name,
        difficulty: qv.question.level,
        topic_slug: qv.question.topic.slug,
        class_slug: qv.class.slug,
        assigned_at: qv.assigned_at
    }));
};
exports.getRecentQuestionsService = getRecentQuestionsService;
