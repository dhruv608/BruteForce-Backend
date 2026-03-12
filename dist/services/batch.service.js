"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBatchService = exports.updateBatchService = exports.getAllBatchesService = exports.createBatchService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const slug_1 = require("../utils/slug");
const createBatchService = async ({ batch_name, year, city_id, }) => {
    if (!batch_name || !year || !city_id) {
        throw new Error("All fields are required");
    }
    const city = await prisma_1.default.city.findUnique({
        where: { id: city_id },
    });
    if (!city) {
        throw new Error("City not found");
    }
    // Prevent duplicate batch name + year in same city
    const duplicate = await prisma_1.default.batch.findFirst({
        where: {
            city_id,
            year,
            batch_name,
        },
    });
    if (duplicate) {
        throw new Error("Batch with same name and year already exists in this city");
    }
    if (!city.city_name) {
        throw new Error("City name is missing");
    }
    const batch = await prisma_1.default.batch.create({
        data: {
            batch_name,
            year,
            city_id,
            slug: (0, slug_1.generateBatchSlug)(city.city_name, batch_name, year),
        },
    });
    return batch;
};
exports.createBatchService = createBatchService;
const getAllBatchesService = async ({ city, year, }) => {
    const filters = {};
    if (city) {
        const cityData = await prisma_1.default.city.findUnique({
            where: { city_name: city },
        });
        if (!cityData) {
            throw new Error("City not found");
        }
        filters.city_id = cityData.id;
    }
    if (year) {
        filters.year = year;
    }
    const batches = await prisma_1.default.batch.findMany({
        where: filters,
        include: {
            city: true,
            _count: {
                select: {
                    students: true,
                    classes: true,
                },
            },
        },
        orderBy: { created_at: "desc" },
    });
    return batches;
};
exports.getAllBatchesService = getAllBatchesService;
const updateBatchService = async ({ id, batch_name, year, city_id, }) => {
    const existingBatch = await prisma_1.default.batch.findUnique({
        where: { id },
    });
    if (!existingBatch) {
        throw new Error("Batch not found");
    }
    const finalBatchName = batch_name ?? existingBatch.batch_name;
    const finalYear = year ?? existingBatch.year;
    const finalCityId = city_id ?? existingBatch.city_id;
    const city = await prisma_1.default.city.findUnique({
        where: { id: finalCityId },
    });
    if (!city) {
        throw new Error("City not found");
    }
    // Prevent duplicate inside same city
    const duplicate = await prisma_1.default.batch.findFirst({
        where: {
            city_id: finalCityId,
            year: finalYear,
            batch_name: finalBatchName,
            NOT: { id: existingBatch.id },
        },
    });
    if (duplicate) {
        throw new Error("Batch with same name and year already exists in this city");
    }
    const updatedBatch = await prisma_1.default.batch.update({
        where: { id: existingBatch.id },
        data: {
            batch_name: finalBatchName,
            year: finalYear,
            city_id: finalCityId,
        },
    });
    return updatedBatch;
};
exports.updateBatchService = updateBatchService;
const deleteBatchService = async ({ id }) => {
    const batch = await prisma_1.default.batch.findUnique({
        where: { id },
    });
    if (!batch) {
        throw new Error("Batch not found");
    }
    const studentCount = await prisma_1.default.student.count({
        where: { batch_id: batch.id },
    });
    if (studentCount > 0) {
        throw new Error("Cannot delete batch with active students");
    }
    await prisma_1.default.batch.delete({
        where: { id: batch.id },
    });
    return true;
};
exports.deleteBatchService = deleteBatchService;
