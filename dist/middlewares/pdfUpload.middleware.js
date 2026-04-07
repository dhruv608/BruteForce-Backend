"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPdf = void 0;
const multer_1 = __importDefault(require("multer"));
// Storage configuration (memory storage for S3 upload)
const storage = multer_1.default.memoryStorage();
// File filter - only allow PDF files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
};
// Multer configuration for PDF uploads
exports.uploadPdf = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit for PDFs
    },
}).single('pdf_file'); // 'pdf_file' is the field name in the form
