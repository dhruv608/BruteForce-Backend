import { Request, Response } from "express";
import { assignQuestionsToClassService, getAssignedQuestionsOfClassService, removeQuestionFromClassService, getAllQuestionsWithFiltersService } from "../services/questionVisibility.service";


export const assignQuestionsToClass = async (
  req: Request,
  res: Response
) => {
  try {
    const batch = (req as any).batch;
    const topicSlugParam = req.params.topicSlug;
    const classSlug = req.params.classSlug;

    if (typeof topicSlugParam !== "string") {
      return res.status(400).json({
        error: "Invalid topic slug",
      });
    }

    if (typeof classSlug !== "string") {
      return res.status(400).json({
        error: "Invalid class slug",
      });
    }

    const { question_ids } = req.body;

    // Validation 1: Check if question_ids is provided
    if (!question_ids) {
      return res.status(400).json({
        error: "question_ids field is required",
      });
    }

    // Validation 2: Check if question_ids is an array
    if (!Array.isArray(question_ids)) {
      return res.status(400).json({
        error: "question_ids must be an array",
      });
    }

    // Validation 3: Check if array is not empty
    if (question_ids.length === 0) {
      return res.status(400).json({
        error: "question_ids array cannot be empty",
      });
    }

    // Validation 4: Check if all elements are numbers
    if (!question_ids.every(id => typeof id === 'number' && id > 0)) {
      return res.status(400).json({
        error: "All question_ids must be positive numbers",
      });
    }

    // Validation 5: Check for duplicate question IDs in request
    const duplicateIds = question_ids.filter((id, index) => question_ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      return res.status(400).json({
        error: `Duplicate question IDs found in request: ${duplicateIds.join(', ')}`,
      });
    }

    const result = await assignQuestionsToClassService({
      batchId: batch.id,
      topicSlug: topicSlugParam,
      classSlug,
      questionIds: question_ids,
    });

    return res.json({
      message: "Questions assigned successfully",
      ...result,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const getAssignedQuestionsOfClass = async (
  req: Request,
  res: Response
) => {
  try {
    const batch = (req as any).batch;
    const topicSlugParam = req.params.topicSlug;
    const classSlug = req.params.classSlug;

    if (typeof topicSlugParam !== "string") {
      return res.status(400).json({
        error: "Invalid topic slug",
      });
    }

    if (typeof classSlug !== "string") {
      return res.status(400).json({
        error: "Invalid class slug",
      });
    }

    const assigned = await getAssignedQuestionsOfClassService({
      batchId: batch.id,
      topicSlug: topicSlugParam,
      classSlug,
    });

    return res.json({
      message: "Assigned questions retrieved successfully",
      data: assigned,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};


export const removeQuestionFromClass = async (
  req: Request,
  res: Response
) => {
  try {
    const batch = (req as any).batch;
    const topicSlugParam = req.params.topicSlug;
    const classSlug = req.params.classSlug;
    const questionIdParam = req.params.questionId;
    
    if (typeof questionIdParam !== "string") {
      return res.status(400).json({
        error: "Invalid question ID",
      });
    }
    
    const questionId = parseInt(questionIdParam);

    if (typeof topicSlugParam !== "string") {
      return res.status(400).json({
        error: "Invalid topic slug",
      });
    }

    if (typeof classSlug !== "string") {
      return res.status(400).json({
        error: "Invalid class slug",
      });
    }

    if (isNaN(questionId)) {
      return res.status(400).json({
        error: "Invalid question ID",
      });
    }

    await removeQuestionFromClassService({
      batchId: batch.id,
      topicSlug: topicSlugParam,
      classSlug,
      questionId,
    });

    return res.json({
      message: "Question removed successfully",
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

// Student-specific controller - get all questions with filters for student's batch
export const getAllQuestionsWithFilters = async (req: Request, res: Response) => {
  try {
    // Get student info from middleware (extractStudentInfo)
    const student = (req as any).student;
    const batchId = (req as any).batchId;
    
    const studentId = student?.id;

    if (!studentId || !batchId) {
      return res.status(400).json({
        error: "Student authentication required",
      });
    }

    // Extract query parameters for filtering
    const {
      search,
      topic,
      level,
      platform,
      type,
      solved,
      page = '1',
      limit = '20'
    } = req.query;

    const filters = {
      search: search as string,
      topic: topic as string,
      level: level as string,
      platform: platform as string,
      type: type as string,
      solved: solved as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const questions = await getAllQuestionsWithFiltersService({
      studentId,
      batchId,
      filters
    });

    return res.json(questions);

  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to fetch questions",
    });
  }
};