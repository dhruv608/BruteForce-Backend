"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminService = exports.updateAdminService = exports.getAllAdminsService = exports.createAdminService = exports.getCityWiseStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hashPassword_1 = require("../utils/hashPassword");
const getCityWiseStats = async () => {
    try {
        const cities = await prisma_1.default.city.findMany({
            include: {
                batches: {
                    select: {
                        id: true,
                        _count: {
                            select: {
                                students: true
                            }
                        }
                    }
                }
            }
        });
        const cityWiseDistribution = await Promise.all(cities.map(async (city) => {
            const batchIds = city.batches.map((batch) => batch.id);
            const [activeBatches, totalStudents] = await Promise.all([
                prisma_1.default.batch.count({
                    where: {
                        city_id: city.id,
                        id: { in: batchIds }
                    }
                }),
                prisma_1.default.student.count({
                    where: {
                        batch_id: { in: batchIds }
                    }
                })
            ]);
            return {
                cityId: city.id,
                cityName: city.city_name,
                activeBatches,
                totalStudents,
                status: "Active"
            };
        }));
        return cityWiseDistribution;
    }
    catch (error) {
        console.error("City-wise stats error:", error);
        throw error;
    }
};
exports.getCityWiseStats = getCityWiseStats;
const createAdminService = async (adminData) => {
    try {
        // Check if email or username already exists
        const existingAdmin = await prisma_1.default.admin.findFirst({
            where: {
                OR: [
                    { email: adminData.email },
                    { username: adminData.username }
                ]
            }
        });
        if (existingAdmin) {
            throw new Error('Email or username already exists');
        }
        // Validate city_id if provided
        if (adminData.city_id) {
            const city = await prisma_1.default.city.findUnique({
                where: { id: adminData.city_id }
            });
            if (!city) {
                throw new Error('City not found');
            }
        }
        // Validate batch_id if provided
        if (adminData.batch_id) {
            const batch = await prisma_1.default.batch.findUnique({
                where: { id: adminData.batch_id }
            });
            if (!batch) {
                throw new Error('Batch not found');
            }
        }
        // Hash password
        const hashedPassword = await (0, hashPassword_1.hashPassword)(adminData.password);
        // Create admin
        const newAdmin = await prisma_1.default.admin.create({
            data: {
                name: adminData.name,
                email: adminData.email,
                username: adminData.username,
                password_hash: hashedPassword,
                role: adminData.role,
                city_id: adminData.city_id || null,
                batch_id: adminData.batch_id || null
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
        return adminResponse;
    }
    catch (error) {
        console.error("Create admin error:", error);
        throw error;
    }
};
exports.createAdminService = createAdminService;
const getAllAdminsService = async (filters = {}) => {
    try {
        const { city_id, batch_id, role } = filters;
        const admins = await prisma_1.default.admin.findMany({
            where: {
                ...(city_id && { city_id: parseInt(city_id) }),
                ...(batch_id && { batch_id: parseInt(batch_id) }),
                ...(role && { role: role })
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                created_at: true,
                updated_at: true,
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
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        return admins;
    }
    catch (error) {
        console.error("Get admins error:", error);
        throw error;
    }
};
exports.getAllAdminsService = getAllAdminsService;
const updateAdminService = async (id, updateData) => {
    try {
        // Check if admin exists
        const existingAdmin = await prisma_1.default.admin.findUnique({
            where: { id }
        });
        if (!existingAdmin) {
            throw new Error('Admin not found');
        }
        // Check for duplicate email/username if updating
        if (updateData.email || updateData.username) {
            const duplicateCheck = await prisma_1.default.admin.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        {
                            OR: [
                                updateData.email && { email: updateData.email },
                                updateData.username && { username: updateData.username }
                            ].filter(Boolean)
                        }
                    ]
                }
            });
            if (duplicateCheck) {
                throw new Error('Email or username already exists');
            }
        }
        // Validate city_id if provided
        if (updateData.city_id) {
            const city = await prisma_1.default.city.findUnique({
                where: { id: updateData.city_id }
            });
            if (!city) {
                throw new Error('City not found');
            }
        }
        // Validate batch_id if provided
        if (updateData.batch_id) {
            const batch = await prisma_1.default.batch.findUnique({
                where: { id: updateData.batch_id }
            });
            if (!batch) {
                throw new Error('Batch not found');
            }
        }
        // Hash password if provided
        if (updateData.password) {
            updateData.password_hash = await (0, hashPassword_1.hashPassword)(updateData.password);
            delete updateData.password; // Remove plain password
        }
        // Update admin
        const updatedAdmin = await prisma_1.default.admin.update({
            where: { id },
            data: {
                ...updateData,
                ...(updateData.role && { role: updateData.role })
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
        const { password_hash, ...adminResponse } = updatedAdmin;
        return adminResponse;
    }
    catch (error) {
        console.error("Update admin error:", error);
        throw error;
    }
};
exports.updateAdminService = updateAdminService;
const deleteAdminService = async (id) => {
    try {
        // Check if admin exists
        const existingAdmin = await prisma_1.default.admin.findUnique({
            where: { id }
        });
        if (!existingAdmin) {
            throw new Error('Admin not found');
        }
        // Delete admin
        await prisma_1.default.admin.delete({
            where: { id }
        });
        return { message: 'Admin deleted successfully' };
    }
    catch (error) {
        console.error("Delete admin error:", error);
        throw error;
    }
};
exports.deleteAdminService = deleteAdminService;
