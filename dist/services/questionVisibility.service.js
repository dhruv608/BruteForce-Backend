"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuestionVisibilityTypeService = exports.getAllQuestionsWithFiltersService = exports.removeQuestionFromClassService = exports.getAssignedQuestionsOfClassService = exports.assignQuestionsToClassService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
const assignQuestionsToClassService = async ({ batchId, topicSlug, classSlug, questions, }) => {
    if (!questions || questions.length === 0) {
        throw new ApiError_1.ApiError(400, "No questions provided");
    }
    // Find topic first
    const topic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    if (!topic) {
        throw new ApiError_1.ApiError(400, "Topic not found");
    }
    const cls = await prisma_1.default.class.findFirst({
        where: {
            slug: classSlug,
            batch_id: batchId,
            topic_id: topic.id, // Add topic validation
        },
    });
    if (!cls) {
        throw new ApiError_1.ApiError(400, "Class not found in this topic and batch");
    }
    const data = questions.map((q) => ({
        class_id: cls.id,
        question_id: q.question_id,
        type: q.type,
    }));
    await prisma_1.default.questionVisibility.createMany({
        data,
        skipDuplicates: true,
    });
    // Update batch question counts after assignment
    await updateBatchQuestionCounts(batchId);
    return { assignedCount: questions.length };
};
exports.assignQuestionsToClassService = assignQuestionsToClassService;
const getAssignedQuestionsOfClassService = async ({ batchId, topicSlug, classSlug, page = 1, limit = 25, search = '', }) => {
    // Enforce max pagination limit for safety
    const safeLimit = Math.min(limit, 100);
    // Validate class exists in batch and topic via relation (single query)
    const cls = await prisma_1.default.class.findFirst({
        where: {
            slug: classSlug,
            batch_id: batchId,
            topic: {
                slug: topicSlug,
            },
        },
        select: { id: true },
    });
    if (!cls) {
        throw new ApiError_1.ApiError(400, "Class not found in this topic and batch");
    }
    // Build where clause
    const whereClause = {
        class_id: cls.id,
    };
    // Add search filter if provided
    if (search) {
        whereClause.question = {
            question_name: {
                contains: search,
                mode: 'insensitive'
            }
        };
    }
    // Calculate pagination
    const skip = (page - 1) * safeLimit;
    // Parallelize count and data queries
    const [total, assigned] = await Promise.all([
        prisma_1.default.questionVisibility.count({
            where: whereClause,
        }),
        prisma_1.default.questionVisibility.findMany({
            where: whereClause,
            select: {
                id: true,
                type: true,
                assigned_at: true,
                question: {
                    select: {
                        id: true,
                        question_name: true,
                        question_link: true,
                        platform: true,
                        level: true,
                        created_at: true,
                        topic: {
                            select: { topic_name: true, slug: true },
                        },
                    },
                },
            },
            orderBy: {
                assigned_at: "desc",
            },
            skip,
            take: safeLimit,
        }),
    ]);
    const totalPages = Math.ceil(total / safeLimit);
    const questions = assigned.map((qv) => ({
        ...qv.question,
        visibility_id: qv.id,
        type: qv.type,
        assigned_at: qv.assigned_at,
    }));
    return {
        data: questions,
        pagination: {
            page,
            limit: safeLimit,
            total,
            totalPages,
        },
    };
};
exports.getAssignedQuestionsOfClassService = getAssignedQuestionsOfClassService;
const removeQuestionFromClassService = async ({ batchId, topicSlug, classSlug, questionId, }) => {
    // Find topic first
    const topic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    if (!topic) {
        throw new ApiError_1.ApiError(400, "Topic not found");
    }
    const cls = await prisma_1.default.class.findFirst({
        where: {
            slug: classSlug,
            batch_id: batchId,
            topic_id: topic.id, // Add topic validation
        },
    });
    if (!cls) {
        throw new ApiError_1.ApiError(400, "Class not found in this topic and batch");
    }
    await prisma_1.default.questionVisibility.deleteMany({
        where: {
            class_id: cls.id,
            question_id: questionId,
        },
    });
    // 🔄 Update batch question counts after removal
    await updateBatchQuestionCounts(batchId);
    return true;
};
exports.removeQuestionFromClassService = removeQuestionFromClassService;
const getAllQuestionsWithFiltersService = async ({ studentId, batchId, filters }) => {
    console.log(' [API] /api/student/addedQuestions - Starting request');
    const apiStartTime = Date.now();
    // Build base where clause for question visibility (questions assigned to this batch)
    const baseWhereClause = {
        class: {
            batch_id: batchId
        }
    };
    // Build filtering conditions
    const filterConditions = [];
    // Search filter (question_name + topic_name)
    if (filters.search) {
        filterConditions.push({
            OR: [
                {
                    question: {
                        question_name: {
                            contains: filters.search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    question: {
                        topic: {
                            topic_name: {
                                contains: filters.search,
                                mode: 'insensitive'
                            }
                        }
                    }
                }
            ]
        });
    }
    // Topic filter
    if (filters.topic) {
        filterConditions.push({
            question: {
                topic: {
                    slug: filters.topic
                }
            }
        });
    }
    // Level filter
    if (filters.level) {
        filterConditions.push({
            question: {
                level: filters.level.toUpperCase()
            }
        });
    }
    // Platform filter
    if (filters.platform) {
        filterConditions.push({
            question: {
                platform: filters.platform.toUpperCase()
            }
        });
    }
    // Type filter - now filters on QuestionVisibility.type
    if (filters.type) {
        filterConditions.push({
            type: filters.type.toUpperCase()
        });
    }
    // Solved/Unsolved filter using relation filtering
    if (filters.solved) {
        const isSolved = filters.solved === 'true';
        if (isSolved) {
            filterConditions.push({
                question: {
                    progress: {
                        some: {
                            student_id: studentId
                        }
                    }
                }
            });
        }
        else {
            filterConditions.push({
                question: {
                    progress: {
                        none: {
                            student_id: studentId
                        }
                    }
                }
            });
        }
    }
    const offset = (filters.page - 1) * filters.limit;
    // Build WHERE conditions for SQL
    const whereConditions = [];
    const params = [];
    // Base condition: batch_id
    whereConditions.push('c.batch_id = $' + (params.length + 1));
    params.push(batchId);
    // Search filter
    if (filters.search) {
        whereConditions.push('(q.question_name ILIKE $' + (params.length + 1) + ' OR t.topic_name ILIKE $' + (params.length + 2) + ')');
        params.push('%' + filters.search + '%', '%' + filters.search + '%');
    }
    // Topic filter
    if (filters.topic) {
        whereConditions.push('t.slug = $' + (params.length + 1));
        params.push(filters.topic);
    }
    // Level filter
    if (filters.level) {
        whereConditions.push('q.level = $' + (params.length + 1) + '::text::"Level"');
        params.push(filters.level.toUpperCase());
    }
    // Platform filter
    if (filters.platform) {
        whereConditions.push('q.platform = $' + (params.length + 1) + '::text::"Platform"');
        params.push(filters.platform.toUpperCase());
    }
    // Type filter - now filters on QuestionVisibility.type
    if (filters.type) {
        whereConditions.push('qv.type = $' + (params.length + 1) + '::text::"QuestionType"');
        params.push(filters.type.toUpperCase());
    }
    // Solved/Unsolved filter
    if (filters.solved) {
        if (filters.solved === 'true') {
            whereConditions.push('sp.question_id IS NOT NULL');
        }
        else {
            whereConditions.push('sp.question_id IS NULL');
        }
    }
    const whereClause = whereConditions.join(' AND ');
    // Calculate indices for studentId in JOIN conditions
    // These will be the same for both queries since they come after filters
    const filterParamsCount = params.length;
    const studentIdParamIndex = filterParamsCount + 1; // First studentId position
    const bookmarkIdParamIndex = filterParamsCount + 2; // Second studentId position
    const limitParamIndex = filterParamsCount + 3; // LIMIT position
    const offsetParamIndex = filterParamsCount + 4; // OFFSET position
    // Main data query params: filter params + 2 studentIds + limit + offset
    const dataParams = [...params, studentId, studentId, filters.limit, offset];
    // Count query params: filter params + 2 studentIds (no limit/offset)
    const countParams = [...params, studentId, studentId];
    // Main data query with single JOIN
    const dataQuery = `
    SELECT DISTINCT 
      q.id,
      q.question_name,
      q.question_link,
      q.level,
      q.platform,
      qv.type,
      q.created_at,
      t.id as topic_id,
      t.topic_name,
      t.slug,
      CASE WHEN sp.question_id IS NOT NULL THEN true ELSE false END as "isSolved",
      CASE WHEN b.question_id IS NOT NULL THEN true ELSE false END as "isBookmarked",
      sp.sync_at
    FROM "QuestionVisibility" qv
    JOIN "Class" c ON qv.class_id = c.id
    JOIN "Question" q ON qv.question_id = q.id
    JOIN "Topic" t ON q.topic_id = t.id
    LEFT JOIN "StudentProgress" sp ON q.id = sp.question_id AND sp.student_id = $${studentIdParamIndex}
    LEFT JOIN "Bookmark" b ON q.id = b.question_id AND b.student_id = $${bookmarkIdParamIndex}
    WHERE ${whereClause}
    ORDER BY q.created_at DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;
    // Count query with same conditions
    const countQuery = `
    SELECT COUNT(DISTINCT q.id) as count
    FROM "QuestionVisibility" qv
    JOIN "Class" c ON qv.class_id = c.id
    JOIN "Question" q ON qv.question_id = q.id
    JOIN "Topic" t ON q.topic_id = t.id
    LEFT JOIN "StudentProgress" sp ON q.id = sp.question_id AND sp.student_id = $${studentIdParamIndex}
    LEFT JOIN "Bookmark" b ON q.id = b.question_id AND b.student_id = $${bookmarkIdParamIndex}
    WHERE ${whereClause}
  `;
    const dbStartTime = Date.now();
    const [paginatedQuestions, totalCount] = await Promise.all([
        prisma_1.default.$queryRawUnsafe(dataQuery, ...dataParams),
        prisma_1.default.$queryRawUnsafe(countQuery, ...countParams)
    ]);
    // Convert BigInt to Number for JSON serialization
    const totalCountNumber = Number(totalCount[0]?.count || 0);
    const dbQueryTime = Date.now() - dbStartTime;
    console.log(` [DB] RAW SQL queries completed in ${dbQueryTime}ms`);
    console.log(`🗄️ [DB] RAW SQL queries completed in ${dbQueryTime}ms`);
    // Map RAW SQL results to exact previous response structure
    const questions = paginatedQuestions.map((row) => {
        return {
            id: row.id,
            question_name: row.question_name,
            question_link: row.question_link,
            level: row.level,
            platform: row.platform,
            type: row.type,
            created_at: row.created_at,
            topic: {
                id: row.topic_id,
                topic_name: row.topic_name,
                slug: row.slug
            },
            isSolved: row.isSolved,
            isBookmarked: row.isBookmarked,
            syncAt: row.sync_at
        };
    });
    // Get filter options from paginated results only (no extra query needed)
    const uniqueTopics = questions.map((q) => q.topic);
    const topics = uniqueTopics.filter((topic, index, self) => self.findIndex((t) => t.id === topic.id) === index);
    // Extract unique values from paginated results
    const levels = [...new Set(questions.map((q) => q.level))].sort();
    const platforms = [...new Set(questions.map((q) => q.platform))].sort();
    const types = [...new Set(questions.map((q) => q.type))].sort();
    // Include all available enum values for complete filter options
    const allLevels = ['EASY', 'MEDIUM', 'HARD'];
    const allPlatforms = ['LEETCODE', 'GFG', 'OTHER', 'INTERVIEWBIT'];
    const allTypes = ['HOMEWORK', 'CLASSWORK'];
    // ...
    // Calculate solved count from paginated results
    const solvedCount = questions.filter(q => q.isSolved).length;
    console.log('📤 [API] Preparing response...');
    const totalApiTime = Date.now() - apiStartTime;
    console.log(`⏱️ [API] Total API time: ${totalApiTime}ms (DB: ${dbQueryTime}ms, Processing: ${totalApiTime - dbQueryTime}ms)`);
    return {
        questions,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            totalQuestions: totalCountNumber,
            totalPages: Math.ceil(totalCountNumber / filters.limit)
        },
        filters: {
            topics,
            levels: allLevels, // All enum values from database
            platforms: allPlatforms, // All enum values from database  
            types: allTypes // All enum values from database
        },
        stats: {
            total: totalCountNumber,
            solved: solvedCount
        }
    };
};
exports.getAllQuestionsWithFiltersService = getAllQuestionsWithFiltersService;
const updateQuestionVisibilityTypeService = async ({ batchId, topicSlug, classSlug, visibilityId, type }) => {
    // Find topic first
    const topic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    if (!topic) {
        throw new ApiError_1.ApiError(400, "Topic not found");
    }
    const cls = await prisma_1.default.class.findFirst({
        where: {
            slug: classSlug,
            batch_id: batchId,
            topic_id: topic.id,
        },
    });
    if (!cls) {
        throw new ApiError_1.ApiError(400, "Class not found in this topic and batch");
    }
    // Verify the visibility record exists and belongs to this class
    const visibility = await prisma_1.default.questionVisibility.findFirst({
        where: {
            id: visibilityId,
            class_id: cls.id,
        },
    });
    if (!visibility) {
        throw new ApiError_1.ApiError(404, "Question visibility record not found");
    }
    // Update the type
    const updated = await prisma_1.default.questionVisibility.update({
        where: { id: visibilityId },
        data: { type },
    });
    return updated;
};
exports.updateQuestionVisibilityTypeService = updateQuestionVisibilityTypeService;
// Helper function to update batch question counts
async function updateBatchQuestionCounts(batchId) {
    try {
        // Get all classes for this batch with their assigned questions
        const batchClasses = await prisma_1.default.class.findMany({
            where: { batch_id: batchId },
            include: {
                questionVisibility: {
                    include: {
                        question: {
                            select: { level: true }
                        }
                    }
                }
            }
        });
        // Count questions by difficulty across all classes
        let hardCount = 0;
        let mediumCount = 0;
        let easyCount = 0;
        for (const classItem of batchClasses) {
            for (const qv of classItem.questionVisibility) {
                switch (qv.question.level) {
                    case 'HARD':
                        hardCount++;
                        break;
                    case 'MEDIUM':
                        mediumCount++;
                        break;
                    case 'EASY':
                        easyCount++;
                        break;
                }
            }
        }
        // Update the batch with the new counts
        await prisma_1.default.batch.update({
            where: { id: batchId },
            data: {
                hard_assigned: hardCount,
                medium_assigned: mediumCount,
                easy_assigned: easyCount
            }
        });
        console.log(`✅ Updated batch ${batchId} question counts: H=${hardCount}, M=${mediumCount}, E=${easyCount}`);
    }
    catch (error) {
        console.error(`❌ Failed to update batch ${batchId} question counts:`, error);
        throw error;
    }
}
