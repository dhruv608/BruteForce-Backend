import { Request, Response } from "express";
import { createClassInTopicService, deleteClassService, getClassDetailsService, getClassesByTopicService, updateClassService, getClassDetailsWithFullQuestionsService } from "../services/class.service";


export const getClassesByTopic = async (
  req: Request,
  res: Response
) => {
  try {
    const batch = (req as any).batch;

    const topicSlugParam = req.params.topicSlug;

    if (typeof topicSlugParam !== "string") {
      return res.status(400).json({
        error: "Invalid topic slug",
      });
    }

    const classes = await getClassesByTopicService({
      batchId: batch.id,
      topicSlug: topicSlugParam, // now guaranteed string
    });

    return res.json(classes);

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const createClassInTopic = async (
  req: Request,
  res: Response
) => {
  try {
    const batch = (req as any).batch;

    const topicSlugParam = req.params.topicSlug;

    if (typeof topicSlugParam !== "string") {
      return res.status(400).json({
        error: "Invalid topic slug",
      });
    }

    const {
      class_name,
      description,
      pdf_url,
      duration_minutes,
      class_date,
    } = req.body;

    const newClass = await createClassInTopicService({
      batchId: batch.id,
      topicSlug: topicSlugParam,
      class_name,
      description,
      pdf_url,
      duration_minutes,
      class_date,
    });

    return res.status(201).json({
      message: "Class created successfully",
      class: newClass,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const getClassDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const batch = (req as any).batch;
    const topicSlugParam = req.params.topicSlug;
    const classSlugParam = req.params.classSlug;

    if (typeof topicSlugParam !== "string") {
      return res.status(400).json({
        error: "Invalid topic slug",
      });
    }

    if (typeof classSlugParam !== "string") {
      return res.status(400).json({
        error: "Invalid class slug",
      });
    }

    const classDetails = await getClassDetailsService({
      batchId: batch.id,
      topicSlug: topicSlugParam,
      classSlug: classSlugParam,
    });

    return res.json(classDetails);

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const updateClass = async (
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

    const updated = await updateClassService({
      batchId: batch.id,
      topicSlug: topicSlugParam,
      classSlug,
      ...req.body,
    });

    return res.json({
      message: "Class updated successfully",
      class: updated,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const deleteClass = async (
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

    await deleteClassService({
      batchId: batch.id,
      topicSlug: topicSlugParam,
      classSlug,
    });

    return res.json({
      message: "Class deleted successfully",
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

// Student-specific controller - get class details with full questions array
export const getClassDetailsWithFullQuestions = async (req: Request, res: Response) => {
  try {
    // Get student info from middleware (extractStudentInfo)
    const student = (req as any).student;
    const batchId = (req as any).batchId;
    const { topicSlug, classSlug } = req.params;
    
    const studentId = student?.id;
    
    // Ensure slugs are strings (not string arrays)
    const topic = Array.isArray(topicSlug) ? topicSlug[0] : topicSlug;
    const cls = Array.isArray(classSlug) ? classSlug[0] : classSlug;

    if (!studentId || !batchId || !topic || !cls) {
      return res.status(400).json({
        error: "Student authentication and topic/class slugs required",
      });
    }

    const classDetails = await getClassDetailsWithFullQuestionsService({
      studentId,
      batchId,
      topicSlug: topic,
      classSlug: cls,
    });

    return res.json(classDetails);

  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to fetch class details",
    });
  }
};
