import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { createTopicService, deleteTopicService, getAllTopicsService, getTopicsForBatchService, updateTopicService } from "../../services/topic.service";



export const createTopic = async (
  req: Request,
  res: Response
) => {
  try {
    const { topic_name } = req.body;

    const topic = await createTopicService({ topic_name });

    return res.status(201).json({
      message: "Topic created successfully",
      topic,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

// Get All Topics
export const getAllTopics = async (_req: Request, res: Response) => {
   try {
    const topics = await getAllTopicsService();
    return res.json(topics);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch topics",
    });
  }
};

export const getTopicsForBatch = async (
  req: Request,
  res: Response
) => {
try {
    const batch = (req as any).batch;

    const topics = await getTopicsForBatchService({
      batchId: batch.id,
    });

    return res.json(topics);

  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch topics for batch",
    });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { topic_name } = req.body;

    const topic = await updateTopicService({
      id: Number(id),
      topic_name,
    });

    return res.json({
      message: "Topic updated successfully",
      topic,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteTopicService({
      id: Number(id),
    });

    return res.json({
      message: "Topic deleted successfully",
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const createTopicsBulk = async (req: Request, res: Response) => {
  try {
    const { topics } = req.body;

    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        error: "Topics must be an array",
      });
    }

    // Slug generate helper
    const generateSlug = (name: string) =>
      name.toLowerCase().trim().replace(/\s+/g, "-");

    const formattedTopics = topics.map((topic_name: string) => ({
      topic_name,
      slug: generateSlug(topic_name),
    }));

    const created = await prisma.topic.createMany({
      data: formattedTopics,
      skipDuplicates: true, // ignore duplicates
    });

    return res.status(201).json({
      message: "Topics uploaded successfully",
      count: created.count,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};