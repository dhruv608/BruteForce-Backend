"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkStudentUploadController = void 0;
const bulk_service_1 = require("../services/bulk.service");
const bulkStudentUploadController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "CSV file required"
            });
        }
        const result = await (0, bulk_service_1.bulkStudentUploadService)(req.file.buffer);
        res.status(201).json({
            message: "Students upload successful",
            ...(typeof result === 'object' && result !== null ? result : {})
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Bulk upload failed"
        });
    }
};
exports.bulkStudentUploadController = bulkStudentUploadController;
