"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassDetailsWithFullQuestionsService = exports.deleteClassService = exports.updateClassService = exports.getClassDetailsService = exports.createClassInTopicService = exports.getClassesByTopicService = void 0;
const slugify_1 = __importDefault(require("slugify"));
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
const s3_service_1 = require("../services/s3.service");
const getClassesByTopicService = async ({ batchId, topicSlug, page = 1, limit = 20, search = '', }) => {
    if (!topicSlug) {
        throw new ApiError_1.ApiError(400, "Invalid topic slug");
    }
    // Build where clause
    const whereClause = {
        batch_id: batchId,
        topic: {
            slug: topicSlug,
        },
    };
    // Add search filter if provided
    if (search) {
        whereClause.class_name = {
            contains: search,
            mode: 'insensitive'
        };
    }
    // Get total count for pagination
    const total = await prisma_1.default.class.count({
        where: whereClause,
    });
    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    const classes = await prisma_1.default.class.findMany({
        where: whereClause,
        include: {
            topic: true, // so we can validate topic existence
            _count: {
                select: {
                    questionVisibility: true,
                },
            },
        },
        orderBy: {
            class_date: "asc",
        },
        skip,
        take: limit,
    });
    // If no classes found, we must check whether topic exists
    if (classes.length === 0 && !search) {
        const topicExists = await prisma_1.default.topic.findUnique({
            where: { slug: topicSlug },
        });
        if (!topicExists) {
            throw new ApiError_1.ApiError(400, "Topic not found");
        }
    }
    const formatted = classes.map((cls) => ({
        id: cls.id,
        class_name: cls.class_name,
        slug: cls.slug,
        description: cls.description,
        pdf_url: cls.pdf_url,
        duration_minutes: cls.duration_minutes,
        class_date: cls.class_date,
        questionCount: cls._count.questionVisibility,
        created_at: cls.created_at,
    }));
    return {
        data: formatted,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};
exports.getClassesByTopicService = getClassesByTopicService;
const createClassInTopicService = async ({ batchId, topicSlug, class_name, description, pdf_url, pdf_file, duration_minutes, class_date, }) => {
    console.log("Creating class with:", { batchId, topicSlug, class_name, class_date });
    if (!topicSlug) {
        throw new ApiError_1.ApiError(400, "Invalid topic slug");
    }
    if (!class_name) {
        throw new ApiError_1.ApiError(400, "Class name is required");
    }
    // 1️⃣ Find Topic
    const topic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    console.log("Found topic:", topic);
    if (!topic) {
        throw new ApiError_1.ApiError(400, `Topic not found with slug: ${topicSlug}`);
    }
    // Handle PDF upload (either URL or file)
    let finalPdfUrl = pdf_url || null;
    let uploadedPdfKey = null;
    if (pdf_file) {
        try {
            // Get batch and topic names for meaningful URL
            const batch = await prisma_1.default.batch.findUnique({
                where: { id: batchId },
                select: { batch_name: true }
            });
            if (!batch) {
                throw new ApiError_1.ApiError(400, "Batch not found");
            }
            // Generate meaningful filename: batch-name/topic-name/class-name.pdf
            const cleanBatchName = (0, slugify_1.default)(batch.batch_name, { lower: true, strict: true });
            const cleanTopicName = (0, slugify_1.default)(topic.topic_name, { lower: true, strict: true });
            const cleanClassName = (0, slugify_1.default)(class_name, { lower: true, strict: true });
            const fileName = `${cleanBatchName}/${cleanTopicName}/${cleanClassName}.pdf`;
            // Upload to S3 with custom folder structure
            const uploadResult = await s3_service_1.S3Service.uploadFile(pdf_file, 'class-pdfs', fileName);
            finalPdfUrl = uploadResult.url;
            uploadedPdfKey = uploadResult.key;
            console.log("PDF uploaded successfully:", { url: finalPdfUrl, key: uploadedPdfKey });
        }
        catch (uploadError) {
            throw new ApiError_1.ApiError(400, "Failed to upload PDF to S3");
        }
    }
    // 2️⃣ Check duplicate inside same topic + batch (unique across both)
    const duplicateName = await prisma_1.default.class.findFirst({
        where: {
            topic_id: topic.id,
            batch_id: batchId,
            class_name,
        },
    });
    if (duplicateName) {
        throw new ApiError_1.ApiError(400, "Class with same name already exists in this topic");
    }
    // 3️⃣ Generate slug unique across topic + batch
    const baseSlug = (0, slugify_1.default)(class_name, {
        lower: true,
        strict: true,
    });
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma_1.default.class.findFirst({
        where: {
            topic_id: topic.id, // ✅ Same topic
            batch_id: batchId, // ✅ Same batch  
            slug: finalSlug, // ✅ Same slug
        },
    })) {
        finalSlug = `${baseSlug}-${counter++}`;
    }
    // 4️⃣ Create class
    let processedDate = null;
    let processedDuration = null;
    if (class_date) {
        try {
            processedDate = new Date(class_date);
            // Validate date
            if (isNaN(processedDate.getTime())) {
                throw new ApiError_1.ApiError(400, "Invalid date format");
            }
            console.log("Processed date:", processedDate);
        }
        catch (error) {
            throw new ApiError_1.ApiError(400, "Invalid date format. Use valid date string");
        }
    }
    // Convert duration_minutes to number if it's a string
    if (duration_minutes) {
        processedDuration = typeof duration_minutes === 'string' ? parseInt(duration_minutes, 10) : duration_minutes;
        if (isNaN(processedDuration)) {
            throw new ApiError_1.ApiError(400, "Invalid duration value");
        }
    }
    try {
        const newClass = await prisma_1.default.class.create({
            data: {
                class_name,
                slug: finalSlug,
                description,
                pdf_url: finalPdfUrl,
                duration_minutes: processedDuration,
                class_date: processedDate,
                topic_id: topic.id,
                batch_id: batchId,
            },
        });
        return newClass;
    }
    catch (dbError) {
        // If database creation fails, clean up uploaded PDF
        if (uploadedPdfKey) {
            try {
                await s3_service_1.S3Service.deleteFile(uploadedPdfKey);
                console.log("Cleaned up PDF after database error");
            }
            catch (cleanupError) {
                console.error("Failed to cleanup PDF after database error:", cleanupError);
            }
        }
        if (dbError.code === "P2002") {
            throw new ApiError_1.ApiError(400, "Class with this name already exists in this topic");
        }
        throw new ApiError_1.ApiError(400, "Failed to create class");
    }
};
exports.createClassInTopicService = createClassInTopicService;
const getClassDetailsService = async ({ batchId, topicSlug, classSlug, }) => {
    if (!classSlug) {
        throw new ApiError_1.ApiError(400, "Invalid class slug");
    }
    if (!topicSlug) {
        throw new ApiError_1.ApiError(400, "Invalid topic slug");
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
        include: {
            topic: {
                select: {
                    id: true,
                    topic_name: true,
                    slug: true,
                },
            },
            _count: {
                select: {
                    questionVisibility: true,
                },
            },
        },
    });
    if (!cls) {
        throw new ApiError_1.ApiError(400, "Class not found in this topic and batch");
    }
    return {
        id: cls.id,
        class_name: cls.class_name,
        slug: cls.slug,
        description: cls.description,
        pdf_url: cls.pdf_url,
        duration_minutes: cls.duration_minutes,
        class_date: cls.class_date,
        questionCount: cls._count.questionVisibility,
        topic: cls.topic,
        created_at: cls.created_at,
    };
};
exports.getClassDetailsService = getClassDetailsService;
const updateClassService = async ({ batchId, topicSlug, classSlug, class_name, description, pdf_url, pdf_file, remove_pdf, duration_minutes, class_date, }) => {
    if (!classSlug) {
        throw new ApiError_1.ApiError(400, "Invalid class slug");
    }
    if (!topicSlug) {
        throw new ApiError_1.ApiError(400, "Invalid topic slug");
    }
    // Find topic first
    const topic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    if (!topic) {
        throw new ApiError_1.ApiError(400, "Topic not found");
    }
    const existingClass = await prisma_1.default.class.findFirst({
        where: {
            slug: classSlug,
            batch_id: batchId,
            topic_id: topic.id,
        },
    });
    if (!existingClass) {
        throw new ApiError_1.ApiError(400, "Class not found in this topic and batch");
    }
    // Handle PDF operations (upload, delete, or update)
    let finalPdfUrl = existingClass.pdf_url;
    let uploadedPdfKey = null;
    let oldPdfKeyToDelete = null;
    // Check if existing PDF is from S3
    const isExistingS3Pdf = existingClass.pdf_url?.includes('amazonaws.com/class-pdfs/');
    if (remove_pdf && existingClass.pdf_url) {
        // Remove PDF entirely
        if (isExistingS3Pdf) {
            // Extract key from S3 URL for deletion
            const urlParts = existingClass.pdf_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            oldPdfKeyToDelete = `class-pdfs/${fileName}`;
        }
        finalPdfUrl = null;
    }
    else if (pdf_file) {
        // Upload new PDF
        try {
            // Get batch and topic names for meaningful URL
            const batch = await prisma_1.default.batch.findUnique({
                where: { id: batchId },
                select: { batch_name: true }
            });
            if (!batch) {
                throw new ApiError_1.ApiError(400, "Batch not found");
            }
            // Generate meaningful filename
            const cleanBatchName = (0, slugify_1.default)(batch.batch_name, { lower: true, strict: true });
            const cleanTopicName = (0, slugify_1.default)(topic.topic_name, { lower: true, strict: true });
            const cleanClassName = (0, slugify_1.default)(class_name || existingClass.class_name, { lower: true, strict: true });
            const fileName = `${cleanBatchName}/${cleanTopicName}/${cleanClassName}.pdf`;
            // Upload new PDF to S3
            const uploadResult = await s3_service_1.S3Service.uploadFile(pdf_file, 'class-pdfs', fileName);
            finalPdfUrl = uploadResult.url;
            uploadedPdfKey = uploadResult.key;
            // Mark old S3 PDF for deletion if it exists
            if (isExistingS3Pdf && existingClass.pdf_url) {
                const urlParts = existingClass.pdf_url.split('/');
                const oldFileName = urlParts[urlParts.length - 1];
                oldPdfKeyToDelete = `class-pdfs/${oldFileName}`;
            }
            console.log("New PDF uploaded successfully:", { url: finalPdfUrl, key: uploadedPdfKey });
        }
        catch (uploadError) {
            throw new ApiError_1.ApiError(400, "Failed to upload PDF to S3");
        }
    }
    else if (pdf_url !== undefined) {
        // Update with new URL (not a file upload)
        finalPdfUrl = pdf_url;
    }
    const finalClassName = class_name ?? existingClass.class_name;
    // Prevent duplicate name in same topic + batch
    const duplicate = await prisma_1.default.class.findFirst({
        where: {
            topic_id: existingClass.topic_id,
            batch_id: batchId,
            class_name: finalClassName,
            NOT: { id: existingClass.id },
        },
    });
    if (duplicate) {
        throw new ApiError_1.ApiError(400, "Class with same name already exists in this topic");
    }
    let newSlug = existingClass.slug;
    if (class_name) {
        const baseSlug = (0, slugify_1.default)(class_name, {
            lower: true,
            strict: true,
        });
        newSlug = baseSlug;
        let counter = 1;
        while (await prisma_1.default.class.findFirst({
            where: {
                batch_id: batchId,
                slug: newSlug,
                NOT: { id: existingClass.id },
            },
        })) {
            newSlug = `${baseSlug}-${counter++}`;
        }
    }
    // Convert duration_minutes to number if it's a string
    let processedDuration = null;
    if (duration_minutes) {
        processedDuration = typeof duration_minutes === 'string' ? parseInt(duration_minutes, 10) : duration_minutes;
        if (isNaN(processedDuration)) {
            throw new ApiError_1.ApiError(400, "Invalid duration value");
        }
    }
    try {
        const updatedClass = await prisma_1.default.class.update({
            where: { id: existingClass.id },
            data: {
                class_name: finalClassName,
                slug: newSlug,
                description: description ?? existingClass.description,
                pdf_url: finalPdfUrl,
                duration_minutes: processedDuration ?? existingClass.duration_minutes,
                class_date: class_date
                    ? new Date(class_date)
                    : existingClass.class_date,
            },
        });
        // Clean up old PDF from S3 if update was successful
        if (oldPdfKeyToDelete) {
            try {
                await s3_service_1.S3Service.deleteFile(oldPdfKeyToDelete);
                console.log("Cleaned up old PDF from S3");
            }
            catch (cleanupError) {
                console.error("Failed to cleanup old PDF from S3:", cleanupError);
            }
        }
        return updatedClass;
    }
    catch (dbError) {
        // If database update fails, clean up newly uploaded PDF
        if (uploadedPdfKey) {
            try {
                await s3_service_1.S3Service.deleteFile(uploadedPdfKey);
                console.log("Cleaned up new PDF after database error");
            }
            catch (cleanupError) {
                console.error("Failed to cleanup new PDF after database error:", cleanupError);
            }
        }
        throw new ApiError_1.ApiError(400, "Failed to update class");
    }
};
exports.updateClassService = updateClassService;
const deleteClassService = async ({ batchId, topicSlug, classSlug, }) => {
    if (!topicSlug) {
        throw new ApiError_1.ApiError(400, "Invalid topic slug");
    }
    // Find topic first
    const topic = await prisma_1.default.topic.findUnique({
        where: { slug: topicSlug },
    });
    if (!topic) {
        throw new ApiError_1.ApiError(400, "Topic not found");
    }
    const existingClass = await prisma_1.default.class.findFirst({
        where: {
            slug: classSlug,
            batch_id: batchId,
            topic_id: topic.id,
        },
    });
    if (!existingClass) {
        throw new ApiError_1.ApiError(400, "Class not found in this topic and batch");
    }
    const questionCount = await prisma_1.default.questionVisibility.count({
        where: { class_id: existingClass.id },
    });
    if (questionCount > 0) {
        throw new ApiError_1.ApiError(400, "Cannot delete class with assigned questions");
    }
    // Check if PDF is from S3 and clean it up
    const isS3Pdf = existingClass.pdf_url?.includes('amazonaws.com/class-pdfs/');
    let pdfKeyToDelete = null;
    if (isS3Pdf && existingClass.pdf_url) {
        const urlParts = existingClass.pdf_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        pdfKeyToDelete = `class-pdfs/${fileName}`;
    }
    // Delete class from database
    await prisma_1.default.class.delete({
        where: { id: existingClass.id },
    });
    // Clean up PDF from S3 if it exists
    if (pdfKeyToDelete) {
        try {
            await s3_service_1.S3Service.deleteFile(pdfKeyToDelete);
            console.log("Cleaned up PDF from S3 after class deletion");
        }
        catch (cleanupError) {
            console.error("Failed to cleanup PDF from S3 after class deletion:", cleanupError);
        }
    }
    return true;
};
exports.deleteClassService = deleteClassService;
const getClassDetailsWithFullQuestionsService = async ({ studentId, batchId, topicSlug, classSlug, query, }) => {
    // Get class with topic and batch validation
    const classData = await prisma_1.default.class.findFirst({
        where: {
            slug: classSlug,
            batch_id: batchId,
            topic: {
                slug: topicSlug
            }
        },
        include: {
            topic: {
                select: {
                    id: true,
                    topic_name: true,
                    slug: true
                }
            },
            questionVisibility: {
                include: {
                    question: {
                        include: {
                            topic: {
                                select: {
                                    id: true,
                                    topic_name: true,
                                    slug: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!classData) {
        throw new ApiError_1.ApiError(400, "Class not found");
    }
    // Get student's solved questions and bookmarks for this class
    const questionIds = classData.questionVisibility.map(qv => qv.question_id);
    const [studentProgress, studentBookmarks] = await Promise.all([
        // Get solved questions
        prisma_1.default.studentProgress.findMany({
            where: {
                student_id: studentId,
                question_id: { in: questionIds }
            },
            select: {
                question_id: true,
                sync_at: true
            }
        }),
        // Get bookmarked questions
        prisma_1.default.bookmark.findMany({
            where: {
                student_id: studentId,
                question_id: { in: questionIds }
            },
            select: {
                question_id: true
            }
        })
    ]);
    // Create Sets for quick lookup
    const solvedQuestionIds = new Set(studentProgress.map(progress => progress.question_id));
    const bookmarkedQuestionIds = new Set(studentBookmarks.map(bookmark => bookmark.question_id));
    console.log(' CLASS DEBUG - studentBookmarks:', studentBookmarks);
    console.log(' CLASS DEBUG - bookmarkedQuestionIds:', Array.from(bookmarkedQuestionIds));
    // Format questions with full details and solved status
    const questionsWithProgress = classData.questionVisibility.map((qv) => {
        const question = qv.question;
        return {
            id: question.id,
            questionName: question.question_name,
            questionLink: question.question_link,
            platform: question.platform,
            level: question.level,
            type: question.type,
            topic: question.topic,
            isSolved: solvedQuestionIds.has(question.id),
            isBookmarked: bookmarkedQuestionIds.has(question.id),
            syncAt: solvedQuestionIds.has(question.id)
                ? studentProgress.find(p => p.question_id === question.id)?.sync_at
                : null
        };
    });
    // Apply filtering
    let filteredQuestions = questionsWithProgress;
    const filter = query?.filter;
    if (filter) {
        switch (filter) {
            case 'solved':
                filteredQuestions = questionsWithProgress.filter(q => q.isSolved);
                break;
            case 'unsolved':
                filteredQuestions = questionsWithProgress.filter(q => !q.isSolved);
                break;
            case 'all':
            default:
                filteredQuestions = questionsWithProgress;
                break;
        }
    }
    // Apply pagination
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);
    // Calculate progress stats (based on all questions, not just filtered)
    const totalQuestions = questionsWithProgress.length;
    const solvedQuestions = questionsWithProgress.filter(q => q.isSolved).length;
    return {
        id: classData.id,
        class_name: classData.class_name,
        slug: classData.slug,
        description: classData.description,
        duration_minutes: classData.duration_minutes,
        pdf_url: classData.pdf_url,
        class_date: classData.class_date,
        created_at: classData.created_at,
        topic: classData.topic,
        totalQuestions,
        solvedQuestions,
        questions: paginatedQuestions,
        pagination: {
            total: filteredQuestions.length,
            totalPages: Math.ceil(filteredQuestions.length / limit),
            page,
            limit,
            hasNext: page < Math.ceil(filteredQuestions.length / limit),
            hasPrev: page > 1
        }
    };
};
exports.getClassDetailsWithFullQuestionsService = getClassDetailsWithFullQuestionsService;
