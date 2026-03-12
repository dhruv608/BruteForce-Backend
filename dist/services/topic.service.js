"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopicOverviewWithClassesSummaryService = exports.getTopicsWithBatchProgressService = exports.deleteTopicService = exports.updateTopicService = exports.getTopicsForBatchService = exports.getAllTopicsService = exports.createTopicService = void 0;
const slugify_1 = __importDefault(require("slugify"));
const prisma_1 = __importDefault(require("../config/prisma"));
const createTopicService = async ({ topic_name, }) => {
    if (!topic_name) {
        throw new Error("Topic name is required");
    }
    const baseSlug = (0, slugify_1.default)(topic_name, {
        lower: true,
        strict: true,
    });
    let finalSlug = baseSlug;
    let counter = 1;
    // Ensure global unique slug
    while (await prisma_1.default.topic.findUnique({
        where: { slug: finalSlug },
    })) {
        finalSlug = `${baseSlug}-${counter++}`;
    }
    try {
        const topic = await prisma_1.default.topic.create({
            data: {
                topic_name,
                slug: finalSlug,
            },
        });
        return topic;
    }
    catch (error) {
        if (error.code === "P2002") {
            throw new Error("Topic already exists");
        }
        throw new Error("Failed to create topic");
    }
};
exports.createTopicService = createTopicService;
const getAllTopicsService = async () => {
    const topics = await prisma_1.default.topic.findMany({
        orderBy: { created_at: "desc" },
    });
    return topics;
};
exports.getAllTopicsService = getAllTopicsService;
const getTopicsForBatchService = async ({ batchId, }) => {
    const topics = await prisma_1.default.topic.findMany({
        include: {
            classes: {
                where: {
                    batch_id: batchId
                },
                include: {
                    questionVisibility: {
                        include: {
                            question: {
                                select: {
                                    id: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    const formatted = topics.map(topic => {
        const uniqueQuestions = new Set();
        topic.classes.forEach(cls => {
            cls.questionVisibility.forEach(qv => {
                uniqueQuestions.add(qv.question.id);
            });
        });
        return {
            id: topic.id,
            topic_name: topic.topic_name,
            slug: topic.slug,
            classCount: topic.classes.length,
            questionCount: uniqueQuestions.size
        };
    });
    return formatted;
};
exports.getTopicsForBatchService = getTopicsForBatchService;
const updateTopicService = async ({ id, topic_name, }) => {
    if (!topic_name) {
        throw new Error("Topic name is required");
    }
    const existingTopic = await prisma_1.default.topic.findUnique({
        where: { id },
    });
    if (!existingTopic) {
        throw new Error("Topic not found");
    }
    const duplicate = await prisma_1.default.topic.findUnique({
        where: { topic_name },
    });
    if (duplicate && duplicate.id !== existingTopic.id) {
        throw new Error("Topic already exists");
    }
    const baseSlug = (0, slugify_1.default)(topic_name, {
        lower: true,
        strict: true,
    });
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma_1.default.topic.findFirst({
        where: {
            slug: finalSlug,
            NOT: { id: existingTopic.id },
        },
    })) {
        finalSlug = `${baseSlug}-${counter++}`;
    }
    const updatedTopic = await prisma_1.default.topic.update({
        where: { id },
        data: {
            topic_name,
            slug: finalSlug,
        },
    });
    return updatedTopic;
};
exports.updateTopicService = updateTopicService;
const deleteTopicService = async ({ id }) => {
    const topic = await prisma_1.default.topic.findUnique({
        where: { id },
    });
    if (!topic) {
        throw new Error("Topic not found");
    }
    const classCount = await prisma_1.default.class.count({
        where: { topic_id: id },
    });
    if (classCount > 0) {
        throw new Error("Cannot delete topic with existing classes");
    }
    const questionCount = await prisma_1.default.question.count({
        where: { topic_id: id },
    });
    if (questionCount > 0) {
        throw new Error("Cannot delete topic with existing questions");
    }
    await prisma_1.default.topic.delete({
        where: { id },
    });
    return true;
};
exports.deleteTopicService = deleteTopicService;
const getTopicsWithBatchProgressService = async ({ studentId, batchId, }) => {
    // Get all topics with batch-specific classes and question counts
    const topics = await prisma_1.default.topic.findMany({
        include: {
            classes: {
                where: {
                    batch_id: batchId
                },
                include: {
                    questionVisibility: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    topic_id: true
                                }
                            }
                        }
                    }
                },
                orderBy: { created_at: 'asc' }
            }
        }
    });
    // Get all question IDs assigned to this batch
    const assignedQuestionIds = new Set();
    topics.forEach((topic) => {
        topic.classes.forEach((cls) => {
            cls.questionVisibility.forEach((qv) => {
                assignedQuestionIds.add(qv.question.id);
            });
        });
    });
    // Get student's solved questions for this batch only
    const studentProgress = await prisma_1.default.studentProgress.findMany({
        where: {
            student_id: studentId,
            question_id: { in: Array.from(assignedQuestionIds) }
        },
        include: {
            question: {
                select: {
                    topic_id: true
                }
            }
        }
    });
    // Group solved questions by topic
    const solvedByTopic = new Map();
    studentProgress.forEach(progress => {
        const topicId = progress.question.topic_id;
        if (!solvedByTopic.has(topicId)) {
            solvedByTopic.set(topicId, new Set());
        }
        solvedByTopic.get(topicId).add(progress.question_id);
    });
    // Format response
    const formattedTopics = topics.map((topic) => {
        // Count unique questions assigned to this batch for this topic
        const assignedQuestions = new Set();
        topic.classes.forEach((cls) => {
            cls.questionVisibility.forEach((qv) => {
                // Only count questions that belong to this topic
                if (qv.question.topic_id === topic.id) {
                    assignedQuestions.add(qv.question.id);
                }
            });
        });
        // Get solved questions for this topic
        const solvedQuestions = solvedByTopic.get(topic.id) || new Set();
        return {
            id: topic.id,
            topic_name: topic.topic_name,
            slug: topic.slug,
            batchSpecificData: {
                totalClasses: topic.classes.length,
                totalQuestions: assignedQuestions.size,
                solvedQuestions: solvedQuestions.size
            }
        };
    });
    return formattedTopics;
};
exports.getTopicsWithBatchProgressService = getTopicsWithBatchProgressService;
const getTopicOverviewWithClassesSummaryService = async ({ studentId, batchId, topicSlug, }) => {
    // Get topic with batch-specific classes
    const topic = await prisma_1.default.topic.findFirst({
        where: { slug: topicSlug },
        include: {
            classes: {
                where: {
                    batch_id: batchId
                },
                include: {
                    questionVisibility: {
                        include: {
                            question: {
                                select: {
                                    id: true
                                }
                            }
                        }
                    }
                },
                orderBy: { created_at: 'asc' }
            }
        }
    });
    if (!topic) {
        throw new Error("Topic not found");
    }
    // Get all question IDs assigned to this batch for this topic
    const assignedQuestionIds = new Set();
    topic.classes.forEach((cls) => {
        cls.questionVisibility.forEach((qv) => {
            assignedQuestionIds.add(qv.question.id);
        });
    });
    // Get student's solved questions for this batch only
    const studentProgress = await prisma_1.default.studentProgress.findMany({
        where: {
            student_id: studentId,
            question_id: { in: Array.from(assignedQuestionIds) }
        },
        include: {
            question: {
                select: {
                    id: true
                }
            }
        }
    });
    // Create a Set of solved question IDs for quick lookup
    const solvedQuestionIds = new Set(studentProgress.map(progress => progress.question_id));
    // Format classes with summary data
    const classesSummary = topic.classes.map((cls) => {
        // Count total questions for this class
        const totalQuestions = cls.questionVisibility.length;
        // Count solved questions for this class
        const solvedQuestions = cls.questionVisibility.filter((qv) => solvedQuestionIds.has(qv.question.id)).length;
        return {
            id: cls.id,
            class_name: cls.class_name,
            slug: cls.slug,
            duration_minutes: cls.duration_minutes,
            description: cls.description,
            totalQuestions,
            solvedQuestions
        };
    });
    // Calculate overall topic progress
    const totalTopicQuestions = classesSummary.reduce((sum, cls) => sum + cls.totalQuestions, 0);
    const totalSolvedQuestions = classesSummary.reduce((sum, cls) => sum + cls.solvedQuestions, 0);
    return {
        id: topic.id,
        topic_name: topic.topic_name,
        slug: topic.slug,
        description: topic.description || null,
        classes: classesSummary,
        overallProgress: {
            totalClasses: classesSummary.length,
            totalQuestions: totalTopicQuestions,
            solvedQuestions: totalSolvedQuestions
        }
    };
};
exports.getTopicOverviewWithClassesSummaryService = getTopicOverviewWithClassesSummaryService;
