"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedTopicsService = exports.getTopicProgressByUsernameService = exports.createTopicsBulkService = exports.getTopicOverviewWithClassesSummaryService = exports.getTopicsWithBatchProgressService = exports.deleteTopicService = exports.updateTopicService = exports.getTopicsForBatchService = exports.getAllTopicsService = exports.createTopicService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const transliteration_1 = require("transliteration");
const s3_service_1 = require("../services/s3.service");
const errorMapper_1 = require("../utils/errorMapper");
const ApiError_1 = require("../utils/ApiError");
const createTopicService = async ({ topic_name, photo }) => {
    let photoKey = null;
    let photoUrl = null;
    // Handle photo upload if provided
    if (photo) {
        try {
            const uploadResult = await s3_service_1.S3Service.uploadFile(photo, 'topics');
            photoUrl = uploadResult.url;
            photoKey = uploadResult.key;
        }
        catch (error) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to upload photo to S3");
        }
    }
    // Generate slug from topic name
    const baseSlug = (0, transliteration_1.slugify)(topic_name).toLowerCase();
    let finalSlug = baseSlug;
    let counter = 1;
    // Check for existing slug and generate unique one if needed
    while (await prisma_1.default.topic.findFirst({
        where: { slug: finalSlug },
    })) {
        finalSlug = `${baseSlug}-${counter++}`;
    }
    try {
        const topic = await prisma_1.default.topic.create({
            data: {
                topic_name,
                slug: finalSlug,
                photo_url: photoUrl,
            },
        });
        return topic;
    }
    catch (error) {
        // If database creation fails, clean up uploaded photo
        if (photoKey) {
            try {
                await s3_service_1.S3Service.deleteFile(photoKey);
            }
            catch (cleanupError) {
                console.error("Failed to cleanup photo after database error:", cleanupError);
            }
        }
        if (error.code === "P2002") {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Topic already exists");
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create topic");
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
const getTopicsForBatchService = async ({ batchId, query }) => {
    // Validate batch exists first (lightweight check)
    const batch = await prisma_1.default.batch.findUnique({
        where: { id: batchId },
        select: { id: true }
    });
    if (!batch) {
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Batch not found");
    }
    // Parse pagination params
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 10;
    const offset = (page - 1) * limit;
    const search = query?.search;
    const sortBy = query?.sortBy || 'recent';
    // Build search condition for SQL
    const searchCondition = search
        ? `AND (LOWER(t.topic_name) ILIKE LOWER($4) OR LOWER(t.slug) ILIKE LOWER($5))`
        : '';
    const searchParams = search ? [`%${search}%`, `%${search}%`] : [];
    // Build ORDER BY clause based on sortBy parameter
    let orderByClause = 'ORDER BY last_class_created_at DESC NULLS LAST, t.created_at DESC';
    if (sortBy === 'oldest') {
        orderByClause = 'ORDER BY last_class_created_at ASC NULLS LAST, t.created_at DESC';
    }
    else if (sortBy === 'classes') {
        orderByClause = 'ORDER BY class_count DESC NULLS LAST, t.created_at DESC';
    }
    else if (sortBy === 'questions') {
        orderByClause = 'ORDER BY question_count DESC NULLS LAST, t.created_at DESC';
    }
    // Main optimized query: Get topics with aggregated counts in a single SQL query
    // Uses LEFT JOIN with aggregation at DB level instead of loading all data into memory
    const topicsQuery = `
    SELECT 
      t.id,
      t.topic_name,
      t.slug,
      t.photo_url,
      t.created_at,
      t.updated_at,
      COUNT(DISTINCT c.id)::int as class_count,
      COUNT(DISTINCT qv.question_id)::int as question_count,
      MAX(c.created_at) as last_class_created_at
    FROM "Topic" t
    LEFT JOIN "Class" c ON t.id = c.topic_id AND c.batch_id = $1
    LEFT JOIN "QuestionVisibility" qv ON c.id = qv.class_id
    WHERE 1=1 ${searchCondition}
    GROUP BY t.id, t.topic_name, t.slug, t.photo_url, t.created_at, t.updated_at
    ${orderByClause}
    LIMIT $2 OFFSET $3
  `;
    // Count query for pagination (total matching topics)
    const countQuery = `
    SELECT COUNT(DISTINCT t.id)::int as total_count
    FROM "Topic" t
    LEFT JOIN "Class" c ON t.id = c.topic_id AND c.batch_id = $1
    WHERE 1=1 ${search ? `AND (LOWER(t.topic_name) ILIKE LOWER($2) OR LOWER(t.slug) ILIKE LOWER($3))` : ''}
  `;
    // Execute queries in parallel
    const [topics, countResult] = await Promise.all([
        prisma_1.default.$queryRawUnsafe(topicsQuery, batchId, limit, offset, ...searchParams),
        prisma_1.default.$queryRawUnsafe(countQuery, batchId, ...searchParams)
    ]);
    const totalCount = countResult[0]?.total_count || 0;
    // Map to exact same response structure as before
    const mappedTopics = topics.map((topic) => ({
        id: topic.id.toString(),
        topic_name: topic.topic_name,
        slug: topic.slug,
        photo_url: topic.photo_url,
        created_at: topic.created_at,
        updated_at: topic.updated_at,
        classCount: Number(topic.class_count) || 0,
        questionCount: Number(topic.question_count) || 0,
        lastClassCreated_at: topic.last_class_created_at
    }));
    return {
        topics: mappedTopics,
        pagination: {
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            page,
            limit
        }
    };
};
exports.getTopicsForBatchService = getTopicsForBatchService;
const updateTopicService = async ({ topicSlug, topic_name, photo, removePhoto }) => {
    // Find existing topic
    const existingTopic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    if (!existingTopic) {
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Topic not found");
    }
    let newPhotoUrl = existingTopic.photo_url;
    let oldPhotoKey = null;
    // Handle photo removal
    if (removePhoto && existingTopic.photo_url) {
        // Extract key from URL
        const urlParts = existingTopic.photo_url.split('/');
        oldPhotoKey = urlParts[urlParts.length - 1];
        if (oldPhotoKey) {
            oldPhotoKey = `topics/${oldPhotoKey}`;
        }
        newPhotoUrl = null;
    }
    // Handle new photo upload
    if (photo) {
        try {
            const uploadResult = await s3_service_1.S3Service.uploadFile(photo, 'topics');
            newPhotoUrl = uploadResult.url;
            // If we had an old photo, mark its key for deletion
            if (existingTopic.photo_url) {
                const urlParts = existingTopic.photo_url.split('/');
                oldPhotoKey = `topics/${urlParts[urlParts.length - 1]}`;
            }
        }
        catch (error) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to upload photo to S3");
        }
    }
    // Handle topic name update if provided
    let finalSlug = existingTopic.slug;
    if (topic_name) {
        const duplicate = await prisma_1.default.topic.findUnique({
            where: { topic_name },
        });
        if (duplicate && duplicate.id !== existingTopic.id) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Topic already exists");
        }
        const baseSlug = (0, transliteration_1.slugify)(topic_name).toLowerCase();
        finalSlug = baseSlug;
        let counter = 1;
        while (await prisma_1.default.topic.findFirst({
            where: {
                slug: finalSlug,
                NOT: { id: existingTopic.id },
            },
        })) {
            finalSlug = `${baseSlug}-${counter++}`;
        }
    }
    try {
        const updatedTopic = await prisma_1.default.topic.update({
            where: { id: existingTopic.id },
            data: {
                ...(topic_name && { topic_name }),
                slug: finalSlug,
                photo_url: newPhotoUrl,
            },
        });
        // Clean up old photo from S3 if update was successful
        if (oldPhotoKey) {
            try {
                await s3_service_1.S3Service.deleteFile(oldPhotoKey);
            }
            catch (cleanupError) {
                console.error("Failed to cleanup old photo from S3:", cleanupError);
            }
        }
        return updatedTopic;
    }
    catch (error) {
        // If database update fails, clean up newly uploaded photo
        if (photo && newPhotoUrl && newPhotoUrl !== existingTopic.photo_url) {
            const urlParts = newPhotoUrl.split('/');
            const newPhotoKey = `topics/${urlParts[urlParts.length - 1]}`;
            try {
                await s3_service_1.S3Service.deleteFile(newPhotoKey);
            }
            catch (cleanupError) {
                console.error("Failed to cleanup new photo after database error:", cleanupError);
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update topic");
    }
};
exports.updateTopicService = updateTopicService;
const deleteTopicService = async ({ topicSlug }) => {
    const topic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    if (!topic) {
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Topic not found");
    }
    const classCount = await prisma_1.default.class.count({
        where: { topic_id: topic.id },
    });
    if (classCount > 0) {
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Cannot delete topic with existing classes");
    }
    const questionCount = await prisma_1.default.question.count({
        where: { topic_id: topic.id },
    });
    if (questionCount > 0) {
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Cannot delete topic with existing questions");
    }
    // Delete topic from database
    await prisma_1.default.topic.delete({
        where: { id: topic.id },
    });
    // Clean up photo from S3 if it exists
    if (topic.photo_url) {
        try {
            const urlParts = topic.photo_url.split('/');
            const photoKey = `topics/${urlParts[urlParts.length - 1]}`;
            await s3_service_1.S3Service.deleteFile(photoKey);
        }
        catch (cleanupError) {
            console.error("Failed to cleanup photo from S3 after topic deletion:", cleanupError);
        }
    }
    return true;
};
exports.deleteTopicService = deleteTopicService;
const getTopicsWithBatchProgressService = async ({ studentId, batchId, query, }) => {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 10;
    const search = query?.search;
    const sortBy = query?.sortBy || 'recent';
    const offset = (page - 1) * limit;
    // Build ORDER BY clause safely
    let orderByClause = 'ORDER BY last_class_created_at DESC NULLS LAST';
    if (sortBy === 'oldest') {
        orderByClause = 'ORDER BY last_class_created_at ASC NULLS LAST';
    }
    else if (sortBy === 'classes') {
        orderByClause = 'ORDER BY class_count DESC NULLS LAST, t.created_at DESC';
    }
    else if (sortBy === 'questions') {
        orderByClause = 'ORDER BY question_count DESC NULLS LAST, t.created_at DESC';
    }
    else if (sortBy === 'strongest') {
        orderByClause = 'ORDER BY progress_percentage DESC NULLS LAST, t.created_at DESC';
    }
    else if (sortBy === 'weakest') {
        orderByClause = 'ORDER BY progress_percentage ASC NULLS LAST, t.created_at DESC';
    }
    // Build queries dynamically based on search presence
    const searchParams = [batchId, studentId];
    const countParams = [batchId];
    let topicsQuery;
    let countQuery;
    if (search) {
        // With search: $1=batchId, $2=studentId, $3=searchName, $4=searchSlug, $5=limit, $6=offset
        const searchPattern = `%${search}%`;
        searchParams.push(searchPattern, searchPattern, limit, offset);
        countParams.push(searchPattern, searchPattern);
        topicsQuery = `
      SELECT 
        t.id,
        t.topic_name,
        t.slug,
        t.photo_url,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT c.id) as class_count,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(DISTINCT CASE WHEN sp.student_id IS NOT NULL THEN q.id END) as solved_questions,
        MAX(c.created_at) as last_class_created_at,
        CASE 
          WHEN COUNT(DISTINCT q.id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN sp.student_id IS NOT NULL THEN q.id END)::float / COUNT(DISTINCT q.id)) * 100)
        END as progress_percentage
      FROM "Topic" t
      LEFT JOIN "Class" c ON t.id = c.topic_id AND c.batch_id = $1
      LEFT JOIN "QuestionVisibility" qv ON c.id = qv.class_id
      LEFT JOIN "Question" q ON qv.question_id = q.id
      LEFT JOIN "StudentProgress" sp ON q.id = sp.question_id AND sp.student_id = $2
      WHERE 1=1 AND (t.topic_name ILIKE $3 OR t.slug ILIKE $4)
      GROUP BY t.id, t.topic_name, t.slug, t.photo_url, t.created_at, t.updated_at
      ${orderByClause}
      LIMIT $5 OFFSET $6
    `;
        countQuery = `
      SELECT COUNT(DISTINCT t.id) as total_count
      FROM "Topic" t
      LEFT JOIN "Class" c ON t.id = c.topic_id AND c.batch_id = $1
      WHERE 1=1 AND (t.topic_name ILIKE $2 OR t.slug ILIKE $3)
    `;
    }
    else {
        // Without search: $1=batchId, $2=studentId, $3=limit, $4=offset
        searchParams.push(limit, offset);
        topicsQuery = `
      SELECT 
        t.id,
        t.topic_name,
        t.slug,
        t.photo_url,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT c.id) as class_count,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(DISTINCT CASE WHEN sp.student_id IS NOT NULL THEN q.id END) as solved_questions,
        MAX(c.created_at) as last_class_created_at,
        CASE 
          WHEN COUNT(DISTINCT q.id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN sp.student_id IS NOT NULL THEN q.id END)::float / COUNT(DISTINCT q.id)) * 100)
        END as progress_percentage
      FROM "Topic" t
      LEFT JOIN "Class" c ON t.id = c.topic_id AND c.batch_id = $1
      LEFT JOIN "QuestionVisibility" qv ON c.id = qv.class_id
      LEFT JOIN "Question" q ON qv.question_id = q.id
      LEFT JOIN "StudentProgress" sp ON q.id = sp.question_id AND sp.student_id = $2
      WHERE 1=1
      GROUP BY t.id, t.topic_name, t.slug, t.photo_url, t.created_at, t.updated_at
      ${orderByClause}
      LIMIT $3 OFFSET $4
    `;
        countQuery = `
      SELECT COUNT(DISTINCT t.id) as total_count
      FROM "Topic" t
      LEFT JOIN "Class" c ON t.id = c.topic_id AND c.batch_id = $1
      WHERE 1=1
    `;
    }
    try {
        // Execute queries
        const topics = await prisma_1.default.$queryRawUnsafe(topicsQuery, ...searchParams);
        const countResult = await prisma_1.default.$queryRawUnsafe(countQuery, ...countParams);
        const totalCount = Number(countResult[0]?.total_count) || 0;
        // Map SQL results to exact same response structure
        const mappedTopics = topics.map((topic) => ({
            id: topic.id.toString(),
            topic_name: topic.topic_name,
            slug: topic.slug,
            photo_url: topic.photo_url,
            created_at: topic.created_at,
            updated_at: topic.updated_at,
            classCount: Number(topic.class_count) || 0,
            questionCount: Number(topic.question_count) || 0,
            lastClassCreated_at: topic.last_class_created_at,
            batchSpecificData: {
                totalClasses: Number(topic.class_count) || 0,
                totalQuestions: Number(topic.question_count) || 0,
                solvedQuestions: Number(topic.solved_questions) || 0
            },
            progressPercentage: Number(topic.progress_percentage) || 0
        }));
        return {
            topics: mappedTopics,
            pagination: {
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                page,
                limit
            }
        };
    }
    catch (error) {
        console.error('Error in getTopicsWithBatchProgressService:', error);
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch topics with progress");
    }
};
exports.getTopicsWithBatchProgressService = getTopicsWithBatchProgressService;
const getTopicOverviewWithClassesSummaryService = async ({ studentId, batchId, topicSlug, query, }) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`[${requestId}] START: getTopicOverviewWithClassesSummaryService`);
    console.time(`[${requestId}] API /topics/:topicSlug TOTAL`);
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 10;
    const offset = (page - 1) * limit;
    // Get topic basic info first
    console.time(`[${requestId}] Query: Fetch Topic Info`);
    const topic = await prisma_1.default.topic.findFirst({
        where: { slug: topicSlug },
        select: {
            id: true,
            topic_name: true,
            slug: true,
            description: true,
            photo_url: true
        }
    });
    console.timeEnd(`[${requestId}] Query: Fetch Topic Info`);
    if (!topic) {
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Topic not found");
    }
    // SINGLE QUERY: Get paginated classes with aggregated data
    console.time(`[${requestId}] Query: Combined Classes + Progress Data`);
    const classesData = await prisma_1.default.$queryRaw `
    SELECT 
      c.id,
      c.class_name,
      c.slug,
      c.description,
      c.pdf_url,
      c.class_date,
      c.created_at,
      COUNT(DISTINCT qv.question_id) as total_questions,
      COUNT(DISTINCT CASE WHEN sp.question_id IS NOT NULL THEN qv.question_id END) as solved_questions
    FROM "Class" c
    LEFT JOIN "QuestionVisibility" qv ON c.id = qv.class_id
    LEFT JOIN "StudentProgress" sp ON qv.question_id = sp.question_id AND sp.student_id = ${studentId}
    WHERE c.topic_id = ${topic.id} AND c.batch_id = ${batchId}
    GROUP BY c.id, c.class_name, c.slug, c.description, c.pdf_url, c.class_date, c.created_at
    ORDER BY c.created_at ASC
    LIMIT ${limit} OFFSET ${offset}
  `;
    console.timeEnd(`[${requestId}] Query: Combined Classes + Progress Data`);
    // SINGLE QUERY: Get total classes count and overall progress
    console.time(`[${requestId}] Query: Total Classes + Overall Progress`);
    const overallData = await prisma_1.default.$queryRaw `
    SELECT 
      COUNT(DISTINCT c.id) as total_classes,
      COUNT(DISTINCT q.id) as total_questions,
      COUNT(DISTINCT sp.question_id) as solved_questions
    FROM "Class" c
    INNER JOIN "QuestionVisibility" qv ON c.id = qv.class_id
    INNER JOIN "Question" q ON qv.question_id = q.id
    LEFT JOIN "StudentProgress" sp ON q.id = sp.question_id AND sp.student_id = ${studentId}
    WHERE c.topic_id = ${topic.id} AND c.batch_id = ${batchId}
  `;
    console.timeEnd(`[${requestId}] Query: Total Classes + Overall Progress`);
    console.time(`[${requestId}] Processing: Format Response`);
    // Format classes data
    const classesSummary = classesData.map((cls) => ({
        id: cls.id,
        class_name: cls.class_name,
        slug: cls.slug,
        description: cls.description,
        pdf_url: cls.pdf_url,
        classDate: cls.class_date,
        totalQuestions: Number(cls.total_questions) || 0,
        solvedQuestions: Number(cls.solved_questions) || 0
    }));
    // Extract overall progress data
    const overall = overallData[0] || {};
    const totalClassesCount = Number(overall.total_classes) || 0;
    const totalTopicQuestions = Number(overall.total_questions) || 0;
    const totalSolvedQuestions = Number(overall.solved_questions) || 0;
    console.timeEnd(`[${requestId}] Processing: Format Response`);
    console.timeEnd(`[${requestId}] API /topics/:topicSlug TOTAL`);
    console.log(`[${requestId}] END: getTopicOverviewWithClassesSummaryService`);
    return {
        id: topic.id,
        topic_name: topic.topic_name,
        slug: topic.slug,
        description: topic.description || null,
        photo_url: topic.photo_url || null,
        classes: classesSummary,
        pagination: {
            total: totalClassesCount,
            totalPages: Math.ceil(totalClassesCount / limit),
            page,
            limit,
            hasNext: page < Math.ceil(totalClassesCount / limit),
            hasPrev: page > 1
        },
        overallProgress: {
            totalClasses: totalClassesCount,
            totalQuestions: totalTopicQuestions,
            solvedQuestions: totalSolvedQuestions
        }
    };
};
exports.getTopicOverviewWithClassesSummaryService = getTopicOverviewWithClassesSummaryService;
const createTopicsBulkService = async (topics) => {
    const created = await prisma_1.default.topic.createMany({
        data: topics,
        skipDuplicates: true, // ignore duplicates
    });
    return created;
};
exports.createTopicsBulkService = createTopicsBulkService;
const getTopicProgressByUsernameService = async (username) => {
    // Find the student by username
    const student = await prisma_1.default.student.findUnique({
        where: { username: username },
        include: {
            batch: true
        }
    });
    if (!student) {
        throw new ApiError_1.ApiError(404, "Student not found", [], "STUDENT_NOT_FOUND");
    }
    if (!student.batch_id) {
        throw new ApiError_1.ApiError(400, "Student is not assigned to any batch", [], "NO_BATCH_ASSIGNED");
    }
    // Get student progress to calculate solved questions
    const studentProgress = await prisma_1.default.studentProgress.findMany({
        where: { student_id: student.id }
    });
    // Get all topics with their classes
    const topics = await prisma_1.default.topic.findMany({
        include: {
            classes: {
                where: {
                    batch_id: student.batch_id
                },
                include: {
                    questionVisibility: {
                        include: {
                            question: {
                                select: {
                                    level: true,
                                    platform: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    // Calculate progress for each topic (same logic as controller)
    const topicsWithProgress = topics.map(topic => {
        const topicClasses = topic.classes;
        const totalQuestions = topicClasses.reduce((sum, classItem) => {
            return sum + classItem.questionVisibility.length;
        }, 0);
        const solvedQuestions = studentProgress.filter(progress => {
            return topicClasses.some(classItem => classItem.questionVisibility.some(qv => qv.question_id === progress.question_id));
        }).length;
        return {
            ...topic,
            totalQuestions,
            solvedQuestions,
            progressPercentage: totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0
        };
    });
    return {
        student: {
            id: student.id,
            name: student.name,
            username: student.username,
            batch: student.batch
        },
        topics: topicsWithProgress
    };
};
exports.getTopicProgressByUsernameService = getTopicProgressByUsernameService;
const getPaginatedTopicsService = async ({ page = 1, limit = 6, search = '' }) => {
    const skip = (page - 1) * limit;
    const whereCondition = {};
    if (search) {
        whereCondition.OR = [
            { topic_name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } }
        ];
    }
    const [topics, totalCount] = await Promise.all([
        prisma_1.default.topic.findMany({
            where: whereCondition,
            select: {
                id: true,
                topic_name: true,
                slug: true,
            },
            orderBy: { topic_name: 'asc' },
            skip,
            take: limit,
        }),
        prisma_1.default.topic.count({ where: whereCondition })
    ]);
    return {
        topics,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1,
        }
    };
};
exports.getPaginatedTopicsService = getPaginatedTopicsService;
