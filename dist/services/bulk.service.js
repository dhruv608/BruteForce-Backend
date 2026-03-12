"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkStudentUploadService = void 0;
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const prisma_1 = __importDefault(require("../config/prisma"));
const bulkStudentUploadService = async (fileBuffer) => {
    const rows = [];
    const stream = stream_1.Readable.from(fileBuffer);
    return new Promise((resolve, reject) => {
        stream
            .pipe((0, csv_parser_1.default)())
            .on("data", (data) => rows.push(data))
            .on("end", async () => {
            const studentsData = [];
            let skippedCount = 0;
            for (const row of rows) {
                // Validate required fields
                if (!row.name || !row.email || !row.enrollment_id || !row.batch_id) {
                    console.log("Missing required fields for:", row.name || 'Unknown');
                    skippedCount++;
                    continue;
                }
                // Check if batch exists
                const batch = await prisma_1.default.batch.findUnique({
                    where: {
                        id: Number(row.batch_id)
                    },
                    select: {
                        city_id: true
                    }
                });
                if (!batch) {
                    console.log("Batch not found for:", row.name);
                    skippedCount++;
                    continue;
                }
                studentsData.push({
                    name: row.name,
                    email: row.email,
                    username: row.username || row.email.split('@')[0], // Generate username if not provided
                    enrollment_id: row.enrollment_id,
                    batch_id: Number(row.batch_id),
                    city_id: batch.city_id,
                    leetcode_id: row.leetcode_id || null,
                    gfg_id: row.gfg_id || null,
                    github: row.github || null,
                    linkedin: row.linkedin || null,
                    provider: 'bulk_upload',
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }
            if (studentsData.length === 0) {
                resolve({
                    inserted: 0,
                    totalRows: rows.length,
                    skipped: skippedCount,
                    message: "No valid students to upload"
                });
                return;
            }
            const created = await prisma_1.default.student.createMany({
                data: studentsData,
                skipDuplicates: true
            });
            resolve({
                inserted: created.count,
                totalRows: rows.length,
                skipped: skippedCount,
                message: `Successfully uploaded ${created.count} students`
            });
        })
            .on("error", reject);
    });
};
exports.bulkStudentUploadService = bulkStudentUploadService;
