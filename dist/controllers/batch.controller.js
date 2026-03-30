"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBatch = exports.updateBatch = exports.getAllBatches = exports.createBatch = void 0;
const batch_service_1 = require("../services/batch.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
//  CREATE BATCH
exports.createBatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { batch_name, year, city_id } = req.body;
        const batch = await (0, batch_service_1.createBatchService)({
            batch_name,
            year: Number(year),
            city_id: Number(city_id),
        });
        return res.status(201).json({
            message: "Batch created successfully",
            batch,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
// 📋 GET ALL BATCHES 
exports.getAllBatches = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { city, year } = req.query;
        const batches = await (0, batch_service_1.getAllBatchesService)({
            city: city,
            year: year ? Number(year) : undefined,
        });
        return res.json(batches);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
//  UPDATE BATCH
exports.updateBatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const { batch_name, year, city_id } = req.body;
        const updatedBatch = await (0, batch_service_1.updateBatchService)({
            id: Number(id),
            batch_name,
            year: year ? Number(year) : undefined,
            city_id: city_id ? Number(city_id) : undefined,
        });
        return res.json({
            message: "Batch updated successfully",
            batch: updatedBatch,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
//  DELETE BATCH
exports.deleteBatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const id = Number(req.params.id);
        await (0, batch_service_1.deleteBatchService)({ id });
        return res.json({
            message: "Batch deleted successfully",
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
