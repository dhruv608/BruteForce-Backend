"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSuperAdminController = exports.createSuperAdminController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hashPassword_1 = require("../utils/hashPassword");
const createSuperAdminController = async (req, res) => {
    try {
        const { name, email, password, role, batch_id } = req.body;
        // Validate required fields
        if (!name || !email || !password || !role || !batch_id) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, email, password, role, batch_id"
            });
        }
        // Check if email already exists (removed username check)
        const existingAdmin = await prisma_1.default.admin.findFirst({
            where: {
                email
            }
        });
        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
        // Validate batch exists and get city_id
        const batch = await prisma_1.default.batch.findUnique({
            where: { id: parseInt(batch_id) },
            include: {
                city: {
                    select: {
                        id: true,
                        city_name: true
                    }
                }
            }
        });
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }
        // Hash password
        const hashedPassword = await (0, hashPassword_1.hashPassword)(password);
        // Create admin with city_id from batch
        const newAdmin = await prisma_1.default.admin.create({
            data: {
                name,
                email,
                password_hash: hashedPassword,
                role: role,
                city_id: batch.city_id, // Get city_id from batch
                batch_id: parseInt(batch_id)
            },
            include: {
                city: {
                    select: {
                        id: true,
                        city_name: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        batch_name: true
                    }
                }
            }
        });
        // Remove password_hash from response
        const { password_hash, ...adminResponse } = newAdmin;
        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: adminResponse
        });
    }
    catch (error) {
        console.error("Create SuperAdmin admin error:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to create admin"
        });
    }
};
exports.createSuperAdminController = createSuperAdminController;
const updateSuperAdminController = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, batch_id } = req.body;
        // Validate admin ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID"
            });
        }
        // Check if admin exists
        const existingAdmin = await prisma_1.default.admin.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        // Only allow role and batch_id updates (major changes only)
        const updateData = {};
        if (role) {
            updateData.role = role;
        }
        if (batch_id) {
            // Validate batch exists and get city_id
            const batch = await prisma_1.default.batch.findUnique({
                where: { id: parseInt(batch_id) },
                include: {
                    city: {
                        select: {
                            id: true,
                            city_name: true
                        }
                    }
                }
            });
            if (!batch) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            updateData.batch_id = parseInt(batch_id);
            updateData.city_id = batch.city_id; // Auto-update city_id from batch
        }
        // Don't allow name, email, username updates
        if (req.body.name || req.body.email || req.body.username) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and username cannot be updated. Only role and batch_id can be updated.'
            });
        }
        // Update admin
        const updatedAdmin = await prisma_1.default.admin.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                city: {
                    select: {
                        id: true,
                        city_name: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        batch_name: true
                    }
                }
            }
        });
        // Remove password_hash from response
        const { password_hash, ...adminResponse } = updatedAdmin;
        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: adminResponse
        });
    }
    catch (error) {
        console.error("Update SuperAdmin admin error:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to update admin"
        });
    }
};
exports.updateSuperAdminController = updateSuperAdminController;
