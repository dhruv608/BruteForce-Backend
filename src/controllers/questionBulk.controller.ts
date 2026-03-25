import { Request, Response } from "express";
import { bulkUploadQuestionsService } from "../services/questionBulk.service";

export const bulkUploadQuestions = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "CSV file is required",
      });
    }

    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({
        error: "Topic ID is required",
      });
    }

    const result = await bulkUploadQuestionsService(
      req.file.buffer,
      Number(topicId)
    );

    return res.json({
      message: "Bulk upload successful",
      ...result,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};