"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBatchReportController = void 0;
const csv_service_1 = require("../services/csv.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
exports.downloadBatchReportController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { batch_id } = req.body;
        console.log('Controller: Received request for batch_id:', batch_id);
        // Generate CSV report (service handles validation)
        const { csvContent, filename } = await (0, csv_service_1.generateBatchReportCSV)(batch_id);
        console.log('Controller: Service returned filename:', filename);
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        console.log('Controller: Response headers set with filename:', filename);
        return res.status(200).json({
            success: true,
            filename: filename,
            csvContent: csvContent
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        console.error("Download batch report error:", error);
        // Handle different error types
        if (error instanceof Error) {
            if (error.message.includes("Valid batch_id is required")) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message.includes("Batch not found")) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to generate batch report"
        });
    }
});
