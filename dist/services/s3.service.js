"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_config_1 = require("../config/s3.config");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const path_1 = __importDefault(require("path"));
const ApiError_1 = require("../utils/ApiError");
class S3Service {
    /**
     * Upload file to S3 bucket
     */
    static async uploadFile(file, folder = 'uploads', customFileName) {
        try {
            // Generate filename (custom if provided, otherwise unique)
            const fileExtension = path_1.default.extname(file.originalname);
            const fileName = customFileName || `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
            const key = `${folder}/${fileName}`;
            // Upload parameters
            const params = {
                Bucket: s3_config_1.S3_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            // Upload to S3
            await s3_config_1.s3Client.send(new client_s3_1.PutObjectCommand(params));
            // Generate public URL
            const url = `https://${s3_config_1.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            return { url, key };
        }
        catch (error) {
            console.error('S3 upload error:', error);
            throw new ApiError_1.ApiError(400, 'Failed to upload file to S3');
        }
    }
    /**
     * Delete file from S3 bucket
     */
    static async deleteFile(key) {
        try {
            const params = {
                Bucket: s3_config_1.S3_BUCKET_NAME,
                Key: key,
            };
            await s3_config_1.s3Client.send(new client_s3_1.DeleteObjectCommand(params));
        }
        catch (error) {
            console.error('S3 delete error:', error);
            throw new ApiError_1.ApiError(400, 'Failed to delete file from S3');
        }
    }
    /**
     * Generate pre-signed URL for file upload (alternative approach)
     */
    static async getUploadUrl(fileName, contentType, folder = 'uploads') {
        try {
            const key = `${folder}/${fileName}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: s3_config_1.S3_BUCKET_NAME,
                Key: key,
                ContentType: contentType,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_config_1.s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
            return { url, key };
        }
        catch (error) {
            console.error('Presigned URL error:', error);
            throw new ApiError_1.ApiError(400, 'Failed to generate upload URL');
        }
    }
}
exports.S3Service = S3Service;
