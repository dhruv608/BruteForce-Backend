import prisma from "../config/prisma";
import { slugify } from "transliteration";
import { S3Service } from "../services/s3.service";
import { HTTP_STATUS } from '../utils/errorMapper';
import { ApiError } from "../utils/ApiError";

export const createTopicService = async ({ topic_name, photo }: { topic_name: string; photo?: Express.Multer.File }) => {
  let photoKey: string | null = null;
  let photoUrl: string | null = null;

  // Handle photo upload if provided
  if (photo) {
    try {
      const uploadResult = await S3Service.uploadFile(photo, 'topics');
      photoUrl = uploadResult.url;
      photoKey = uploadResult.key;
    } catch (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to upload photo to S3");
    }
  }

  // Generate slug from topic name
  const baseSlug = slugify(topic_name).toLowerCase();

  let finalSlug = baseSlug;
  let counter = 1;

  // Check for existing slug and generate unique one if needed
  while (
    await prisma.topic.findFirst({
      where: { slug: finalSlug },
    })
  ) {
    finalSlug = `${baseSlug}-${counter++}`;
  }

  try {
    const topic = await prisma.topic.create({
      data: {
        topic_name,
        slug: finalSlug,
        photo_url: photoUrl,
      },
    });

    return topic;
  } catch (error: any) {
    // If database creation fails, clean up uploaded photo
    if (photoKey) {
      try {
        await S3Service.deleteFile(photoKey);
      } catch (cleanupError) {
        console.error("Failed to cleanup photo after database error:", cleanupError);
      }
    }

    if (error.code === "P2002") {
      throw new ApiError(HTTP_STATUS.CONFLICT, "Topic already exists");
    }

    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create topic");
  }
};

export const getAllTopicsService = async () => {
  const topics = await prisma.topic.findMany({
    orderBy: { created_at: "desc" },
  });

  return topics;
};

interface GetTopicsForBatchInput {
  batchId: number;
  query?: any;
}

export const getTopicsForBatchService = async ({ batchId, query }: GetTopicsForBatchInput) => {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      classes: {
        where: { batch_id: batchId },
        include: {
          topic: true,
          questionVisibility: {
            include: {
              question: {
                select: {
                  id: true,
                  topic_id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!batch) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Batch not found");
  }

  const allTopics = await prisma.topic.findMany({
    orderBy: { created_at: "desc" }
  });

  const batchClasses = await prisma.class.findMany({
    where: { batch_id: batchId },
    include: {
      questionVisibility: true
    }
  });

  const topicStats = new Map();

  batchClasses.forEach(cls => {
    const currentStats = topicStats.get(cls.topic_id) || { classCount: 0, questionCount: 0 };
    currentStats.classCount += 1;
    currentStats.questionCount += cls.questionVisibility.length;
    topicStats.set(cls.topic_id, currentStats);
  });

  const topics = allTopics.map(topic => {
    const stats = topicStats.get(topic.id) || { classCount: 0, questionCount: 0 };
    
    const topicClasses = batchClasses.filter(cls => cls.topic_id === topic.id);
    const lastClass = topicClasses.length > 0
      ? topicClasses.reduce((latest: any, cls: any) => 
          !latest || new Date(cls.created_at) > new Date(latest.created_at) ? cls : latest
        , null)
      : null;

    return {
      id: topic.id.toString(),
      topic_name: topic.topic_name,
      slug: topic.slug,
      photo_url: topic.photo_url,
      created_at: topic.created_at,
      updated_at: topic.updated_at,
      classCount: stats.classCount,        
      questionCount: stats.questionCount,  
      lastClassCreated_at: lastClass?.created_at || null
    };
  });

  const topicMap = new Map();

  allTopics.forEach(topic => {
    topicMap.set(topic.id, {
      id: topic.id.toString(),
      topic_name: topic.topic_name,
      slug: topic.slug,
      photo_url: topic.photo_url,
      classCount: 0,
      questionCount: 0,
      lastClassCreated_at: null
    });
  });

  batch.classes.forEach(cls => {
    const topic = topicMap.get(cls.topic.id);
    if (topic) {
      topic.classCount = (topic.classCount || 0) + 1;
      topic.questionCount = (topic.questionCount || 0) + cls.questionVisibility.length;
      topic.lastClassCreated_at = cls.created_at;
    }
  });

  let filteredTopics = topics;
  if (query?.search) {
    filteredTopics = topics.filter(topic =>
      topic.topic_name.toLowerCase().includes(query.search.toLowerCase())
    );
  }

  const sortBy = query?.sortBy || 'recent';
  filteredTopics.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        if (!a.lastClassCreated_at && !b.lastClassCreated_at) return 0;
        if (!a.lastClassCreated_at) return 1;
        if (!b.lastClassCreated_at) return -1;
        return new Date(a.lastClassCreated_at).getTime() - new Date(b.lastClassCreated_at).getTime();
      case 'classes':
        return (b.classCount || 0) - (a.classCount || 0);
      case 'questions':
        return (b.questionCount || 0) - (a.questionCount || 0);
      case 'recent':
      default:
        if (!a.lastClassCreated_at && !b.lastClassCreated_at) return 0;
        if (!a.lastClassCreated_at) return 1;
        if (!b.lastClassCreated_at) return -1;
        return new Date(b.lastClassCreated_at).getTime() - new Date(a.lastClassCreated_at).getTime();
    }
  });

  const page = parseInt(query?.page as string) || 1;
  const limit = parseInt(query?.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTopics = filteredTopics.slice(startIndex, endIndex);

  return {
    topics: paginatedTopics,
    pagination: {
      total: filteredTopics.length,
      totalPages: Math.ceil(filteredTopics.length / limit),
      page,
      limit
    }
  };
};

interface UpdateTopicInput {
  topicSlug: string;
  topic_name?: string;
  photo?: Express.Multer.File;
  removePhoto?: boolean;
}

export const updateTopicService = async ({ topicSlug, topic_name, photo, removePhoto }: UpdateTopicInput) => {
  // Find existing topic
  const existingTopic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
  });

  if (!existingTopic) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Topic not found");
  }

  let newPhotoUrl: string | null = existingTopic.photo_url;
  let oldPhotoKey: string | null = null;

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
      const uploadResult = await S3Service.uploadFile(photo, 'topics');
      newPhotoUrl = uploadResult.url;

      // If we had an old photo, mark its key for deletion
      if (existingTopic.photo_url) {
        const urlParts = existingTopic.photo_url.split('/');
        oldPhotoKey = `topics/${urlParts[urlParts.length - 1]}`;
      }
    } catch (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to upload photo to S3");
    }
  }

  // Handle topic name update if provided
  let finalSlug = existingTopic.slug;
  if (topic_name) {
    const duplicate = await prisma.topic.findUnique({
      where: { topic_name },
    });

    if (duplicate && duplicate.id !== existingTopic.id) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "Topic already exists");
    }

    const baseSlug = slugify(topic_name).toLowerCase();

    finalSlug = baseSlug;
    let counter = 1;

    while (
      await prisma.topic.findFirst({
        where: {
          slug: finalSlug,
          NOT: { id: existingTopic.id },
        },
      })
    ) {
      finalSlug = `${baseSlug}-${counter++}`;
    }
  }

  try {
    const updatedTopic = await prisma.topic.update({
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
        await S3Service.deleteFile(oldPhotoKey);
      } catch (cleanupError) {
        console.error("Failed to cleanup old photo from S3:", cleanupError);
      }
    }

    return updatedTopic;

  } catch (error: any) {
    // If database update fails, clean up newly uploaded photo
    if (photo && newPhotoUrl && newPhotoUrl !== existingTopic.photo_url) {
      const urlParts = newPhotoUrl.split('/');
      const newPhotoKey = `topics/${urlParts[urlParts.length - 1]}`;
      try {
        await S3Service.deleteFile(newPhotoKey);
      } catch (cleanupError) {
        console.error("Failed to cleanup new photo after database error:", cleanupError);
      }
    }

    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update topic");
  }
};

interface DeleteTopicInput {
  topicSlug: string;
}

export const deleteTopicService = async ({ topicSlug }: DeleteTopicInput) => {
  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
  });

  if (!topic) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Topic not found");
  }

  const classCount = await prisma.class.count({
    where: { topic_id: topic.id },
  });

  if (classCount > 0) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "Cannot delete topic with existing classes");
  }

  const questionCount = await prisma.question.count({
    where: { topic_id: topic.id },
  });

  if (questionCount > 0) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "Cannot delete topic with existing questions");
  }

  // Delete topic from database
  await prisma.topic.delete({
    where: { id: topic.id },
  });

  // Clean up photo from S3 if it exists
  if (topic.photo_url) {
    try {
      const urlParts = topic.photo_url.split('/');
      const photoKey = `topics/${urlParts[urlParts.length - 1]}`;
      await S3Service.deleteFile(photoKey);
    } catch (cleanupError) {
      console.error("Failed to cleanup photo from S3 after topic deletion:", cleanupError);
    }
  }

  return true;
};

interface GetTopicsWithBatchProgressInput {
  studentId: number;
  batchId: number;
  query?: any;
}

export const getTopicsWithBatchProgressService = async ({
  studentId,
  batchId,
  query,
}: GetTopicsWithBatchProgressInput) => {
  const page = parseInt(query?.page as string) || 1;
  const limit = parseInt(query?.limit as string) || 10;
  const search = query?.search as string;
  const sortBy = query?.sortBy || 'recent';
  const offset = (page - 1) * limit;

  // Build search condition
  const searchCondition = search ? `AND (LOWER(t.topic_name) ILIKE LOWER(?) OR LOWER(t.slug) ILIKE LOWER(?))` : '';
  const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

  // Build ORDER BY clause safely
  let orderByClause = 'ORDER BY last_class_created_at DESC NULLS LAST';
  if (sortBy === 'oldest') {
    orderByClause = 'ORDER BY last_class_created_at ASC NULLS LAST';
  } else if (sortBy === 'classes') {
    orderByClause = 'ORDER BY class_count DESC NULLS LAST, t.created_at DESC';
  } else if (sortBy === 'questions') {
    orderByClause = 'ORDER BY question_count DESC NULLS LAST, t.created_at DESC';
  } else if (sortBy === 'strongest') {
    orderByClause = 'ORDER BY progress_percentage DESC NULLS LAST, t.created_at DESC';
  } else if (sortBy === 'weakest') {
    orderByClause = 'ORDER BY progress_percentage ASC NULLS LAST, t.created_at DESC';
  }

  // Main query with all aggregations
  const topicsQuery = `
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
    WHERE 1=1 ${searchCondition}
    GROUP BY t.id, t.topic_name, t.slug, t.photo_url, t.created_at, t.updated_at
    ${orderByClause}
    LIMIT $3 OFFSET $4
  `;

  // Count query for pagination metadata
  const countQuery = `
    SELECT COUNT(DISTINCT t.id) as total_count
    FROM "Topic" t
    LEFT JOIN "Class" c ON t.id = c.topic_id AND c.batch_id = $1
    WHERE 1=1 ${searchCondition}
  `;

  try {
    // Execute main query with parameters
    const topics = await prisma.$queryRawUnsafe(
      topicsQuery,
      batchId,
      studentId,
      ...searchParams,
      limit,
      offset
    ) as any[];

    // Execute count query
    const countResult = await prisma.$queryRawUnsafe(
      countQuery,
      batchId,
      ...searchParams
    ) as any[];

    const totalCount = Number(countResult[0]?.total_count) || 0;

    // Map SQL results to exact same response structure
    const mappedTopics = topics.map((topic: any) => ({
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
  } catch (error: any) {
    console.error('Error in getTopicsWithBatchProgressService:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch topics with progress");
  }
};

interface GetTopicOverviewWithClassesSummaryInput {
  studentId: number;
  batchId: number;
  topicSlug: string;
  query?: any;
}

export const getTopicOverviewWithClassesSummaryService = async ({
  studentId,
  batchId,
  topicSlug,
  query,
}: GetTopicOverviewWithClassesSummaryInput) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] START: getTopicOverviewWithClassesSummaryService`);
  console.time(`[${requestId}] API /topics/:topicSlug TOTAL`);
  
  const page = parseInt(query?.page as string) || 1;
  const limit = parseInt(query?.limit as string) || 10;
  const offset = (page - 1) * limit;

  // Get topic with paginated classes (clean query without _count)
  console.time(`[${requestId}] Query: Fetch Topic + Paginated Classes`);
  const topic = await prisma.topic.findFirst({
    where: { slug: topicSlug },
    select: {
      id: true,
      topic_name: true,
      slug: true,
      description: true,
      photo_url: true,
      classes: {
        where: { batch_id: batchId },
        select: {
          id: true,
          class_name: true,
          slug: true,
          description: true,
          pdf_url: true,
          class_date: true,
          created_at: true
        },
        orderBy: { created_at: 'asc' },
        skip: offset,
        take: limit
      }
    }
  });
  console.timeEnd(`[${requestId}] Query: Fetch Topic + Paginated Classes`);

  if (!topic) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Topic not found");
  }

  // Get total classes count for pagination metadata (optimized - no OFFSET)
  console.time(`[${requestId}] Query: Count Total Classes`);
  const totalClassesCount = await prisma.class.count({
    where: { topic_id: topic.id, batch_id: batchId }
  });
  console.timeEnd(`[${requestId}] Query: Count Total Classes`);

  // Get ALL questionVisibility data in ONE query for paginated classes
  const paginatedClassIds = topic.classes.map(cls => cls.id);
  console.time(`[${requestId}] Query: Fetch QuestionVisibility (SINGLE)`);
  const questionVisibilityRecords = await prisma.questionVisibility.findMany({
    where: { class_id: { in: paginatedClassIds } },
    select: { class_id: true, question_id: true }
  });
  console.timeEnd(`[${requestId}] Query: Fetch QuestionVisibility (SINGLE)`);

  // Process questionVisibility data in JavaScript (no duplicate queries)
  console.time(`[${requestId}] Processing: Build Maps`);
  const questionIdsByClass = new Map<number, number[]>();
  const questionCountMap = new Map<number, number>();
  
  questionVisibilityRecords.forEach(qv => {
    // Group question IDs by class
    if (!questionIdsByClass.has(qv.class_id)) {
      questionIdsByClass.set(qv.class_id, []);
    }
    questionIdsByClass.get(qv.class_id)!.push(qv.question_id);
    
    // Count questions per class
    questionCountMap.set(qv.class_id, (questionCountMap.get(qv.class_id) || 0) + 1);
  });

  const allQuestionIds = Array.from(new Set(questionVisibilityRecords.map(qv => qv.question_id)));
  console.timeEnd(`[${requestId}] Processing: Build Maps`);

  // Fetch student progress only for questions in paginated classes
  console.time(`[${requestId}] Query: Fetch Student Progress`);
  const studentProgress = await prisma.studentProgress.findMany({
    where: { student_id: studentId, question_id: { in: allQuestionIds } },
    select: { question_id: true }
  });
  console.timeEnd(`[${requestId}] Query: Fetch Student Progress`);

  // Create Set of solved question IDs
  const solvedQuestionIds = new Set(studentProgress.map(progress => progress.question_id));

  // Format classes with summary data
  console.time(`[${requestId}] Processing: Format Classes`);
  const classesSummary = topic.classes.map((cls: any) => {
    const classQuestionIds = questionIdsByClass.get(cls.id) || [];
    const totalQuestions = questionCountMap.get(cls.id) || 0;
    const solvedQuestions = classQuestionIds.filter(questionId =>
      solvedQuestionIds.has(questionId)
    ).length;

    return {
      id: cls.id,
      class_name: cls.class_name,
      slug: cls.slug,
      description: cls.description,
      pdf_url: cls.pdf_url,
      classDate: cls.class_date,
      totalQuestions,
      solvedQuestions
    };
  });
  console.timeEnd(`[${requestId}] Processing: Format Classes`);

  // Calculate overall topic progress using single optimized query
  console.time(`[${requestId}] Query: Overall Progress`);
  const topicProgressData = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT q.id) as total_questions,
      COUNT(DISTINCT CASE WHEN sp.student_id IS NOT NULL THEN q.id END) as solved_questions
    FROM "Class" c
    LEFT JOIN "QuestionVisibility" qv ON c.id = qv.class_id
    LEFT JOIN "Question" q ON qv.question_id = q.id
    LEFT JOIN "StudentProgress" sp ON q.id = sp.question_id AND sp.student_id = ${studentId}
    WHERE c.topic_id = ${topic.id} AND c.batch_id = ${batchId}
  ` as any[];
  console.timeEnd(`[${requestId}] Query: Overall Progress`);

  const totalTopicQuestions = Number(topicProgressData[0]?.total_questions) || 0;
  const totalSolvedQuestions = Number(topicProgressData[0]?.solved_questions) || 0;

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

export const createTopicsBulkService = async (topics: Array<{ topic_name: string; slug: string }>) => {
  const created = await prisma.topic.createMany({
    data: topics,
    skipDuplicates: true, // ignore duplicates
  });

  return created;
};

export const getTopicProgressByUsernameService = async (username: string) => {
  // Find the student by username
  const student = await prisma.student.findUnique({
    where: { username: username as string },
    include: {
      batch: true
    }
  });

  if (!student) {
    throw new ApiError(404, "Student not found", [], "STUDENT_NOT_FOUND");
  }
  if (!student.batch_id) {
    throw new ApiError(400, "Student is not assigned to any batch", [], "NO_BATCH_ASSIGNED");
  }
  // Get student progress to calculate solved questions
  const studentProgress = await prisma.studentProgress.findMany({
    where: { student_id: student.id }
  });

  // Get all topics with their classes
  const topics = await prisma.topic.findMany({
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
                  platform: true,
                  type: true
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
      return topicClasses.some(classItem =>
        classItem.questionVisibility.some(qv => qv.question_id === progress.question_id)
      );
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

export const getPaginatedTopicsService = async ({
  page = 1,
  limit = 6,
  search = ''
}: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const skip = (page - 1) * limit;

  const whereCondition: any = {};
  if (search) {
    whereCondition.OR = [
      { topic_name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [topics, totalCount] = await Promise.all([
    prisma.topic.findMany({
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
    prisma.topic.count({ where: whereCondition })
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