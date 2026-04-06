import { Request, Response } from "express";
import { createClassInTopicService, deleteClassService, getClassDetailsService, getClassesByTopicService, updateClassService, getClassDetailsWithFullQuestionsService } from "../services/class.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

export const getClassesByTopic = asyncHandler(async (
          req: Request,
          res: Response
        ) => {
          try {
            const batch = (req as any).batch;

            const topicSlugParam = req.params.topicSlug;

            if (typeof topicSlugParam !== "string") {
              throw new ApiError(400, "Invalid topic slug",);
            }

            // Extract pagination and search parameters
            const {
              page = '1',
              limit = '20',
              search = ''
            } = req.query;

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const searchQuery = search as string;

            const classes = await getClassesByTopicService({
              batchId: batch.id,
              topicSlug: topicSlugParam,
              page: pageNum,
              limit: limitNum,
              search: searchQuery,
            });

            return res.json(classes);

          } catch (error: any) {
    if (error instanceof ApiError) throw error;
            throw new ApiError(400, error.message,);
          }
        });

export const createClassInTopic = asyncHandler(async (
          req: Request,
          res: Response
        ) => {
          try {
            const batch = (req as any).batch;

            const topicSlugParam = req.params.topicSlug;

            if (typeof topicSlugParam !== "string") {
              throw new ApiError(400, "Invalid topic slug",);
            }

            const {
              class_name,
              description,
              pdf_url,
              duration_minutes,
              class_date,
            } = req.body;

            // Handle PDF file upload
            const pdf_file = (req as any).file;

            const newClass = await createClassInTopicService({
              batchId: batch.id,
              topicSlug: topicSlugParam,
              class_name,
              description,
              pdf_url,
              pdf_file,
              duration_minutes,
              class_date,
            });

            
            return res.status(201).json({
              message: "Class created successfully",
              class: newClass,
            });
          
          } catch (error: any) {
    if (error instanceof ApiError) throw error;
            throw new ApiError(400, error.message,);
          }
        });


export const getClassDetails = asyncHandler(async (
          req: Request,
          res: Response
        ) => {
          try {
            const batch = (req as any).batch;
            const topicSlugParam = req.params.topicSlug;
            const classSlugParam = req.params.classSlug;

            if (typeof topicSlugParam !== "string") {
              throw new ApiError(400, "Invalid topic slug",);
            }

            if (typeof classSlugParam !== "string") {
              throw new ApiError(400, "Invalid class slug",);
            }

            const classDetails = await getClassDetailsService({
              batchId: batch.id,
              topicSlug: topicSlugParam,
              classSlug: classSlugParam,
            });

            return res.json(classDetails);

          } catch (error: any) {
    if (error instanceof ApiError) throw error;
            throw new ApiError(400, error.message,);
          }
        });

export const updateClass = asyncHandler(async (
          req: Request,
          res: Response
        ) => {
          try {
            const batch = (req as any).batch;
            const topicSlugParam = req.params.topicSlug;
            const classSlug = req.params.classSlug;

            if (typeof topicSlugParam !== "string") {
              throw new ApiError(400, "Invalid topic slug",);
            }

            if (typeof classSlug !== "string") {
              throw new ApiError(400, "Invalid class slug",);
            }

            const updated = await updateClassService({
              batchId: batch.id,
              topicSlug: topicSlugParam,
              classSlug,
              ...req.body,
              pdf_file: (req as any).file, // Handle PDF file upload
            });

            return res.json({
              message: "Class updated successfully",
              class: updated,
            });

          } catch (error: any) {
    if (error instanceof ApiError) throw error;
            throw new ApiError(400, error.message,);
          }
        });

export const deleteClass = asyncHandler(async (
          req: Request,
          res: Response
        ) => {
          try {
            const batch = (req as any).batch;
            const topicSlugParam = req.params.topicSlug;
            const classSlug = req.params.classSlug;

            if (typeof topicSlugParam !== "string") {
              throw new ApiError(400, "Invalid topic slug",);
            }

            if (typeof classSlug !== "string") {
              throw new ApiError(400, "Invalid class slug",);
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
    if (error instanceof ApiError) throw error;
            throw new ApiError(400, error.message,);
          }
        });

// Student-specific controller - get class details with full questions array
export const getClassDetailsWithFullQuestions = asyncHandler(async (req: Request, res: Response) => {
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
              throw new ApiError(400, "Student authentication and topic/class slugs required",);
            }

            const classDetails = await getClassDetailsWithFullQuestionsService({
              studentId,
              batchId,
              topicSlug: topic,
              classSlug: cls,
              query: req.query,
            });

            return res.json(classDetails);

          } catch (error: any) {
    if (error instanceof ApiError) throw error;
            throw new ApiError(500, error.message || "Failed to fetch class details",);
          }
        });
