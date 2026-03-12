"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBatch = exports.updateBatch = exports.getAllBatches = exports.createBatch = void 0;
const batch_service_1 = require("../services/batch.service");
//  CREATE BATCH
const createBatch = async (req, res) => {
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
        return res.status(400).json({
            error: error.message,
        });
    }
};
exports.createBatch = createBatch;
// 📋 GET ALL BATCHES 
const getAllBatches = async (req, res) => {
    try {
        const { city, year } = req.query;
        const batches = await (0, batch_service_1.getAllBatchesService)({
            city: city,
            year: year ? Number(year) : undefined,
        });
        return res.json(batches);
    }
    catch (error) {
        return res.status(400).json({
            error: error.message,
        });
    }
};
exports.getAllBatches = getAllBatches;
//  UPDATE BATCH
const updateBatch = async (req, res) => {
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
        return res.status(400).json({
            error: error.message,
        });
    }
};
exports.updateBatch = updateBatch;
//  DELETE BATCH
const deleteBatch = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await (0, batch_service_1.deleteBatchService)({ id });
        return res.json({
            message: "Batch deleted successfully",
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error.message,
        });
    }
};
exports.deleteBatch = deleteBatch;
