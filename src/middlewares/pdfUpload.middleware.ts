import multer from 'multer';
import path from 'path';

// Storage configuration (memory storage for S3 upload)
const storage = multer.memoryStorage();

// File filter - only allow PDF files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'));
  }
};

// Multer configuration for PDF uploads
export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for PDFs
  },
}).single('pdf_file'); // 'pdf_file' is the field name in the form
