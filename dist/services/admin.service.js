"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminService = exports.updateAdminService = exports.getAllAdminsService = exports.createAdminService = exports.getCityWiseStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hashPassword_1 = require("../utils/hashPassword");
const ApiError_1 = require("../utils/ApiError");
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
        // Check if email already exists (removed username check)
        const existingAdmin = await prisma_1.default.admin.findFirst({
            where: {
                email: adminData.email
            }
        });
        if (existingAdmin) {
            throw new ApiError_1.ApiError(400, 'Email already exists', [], "USER_EXISTS");
        }
        // Validate city_id if provided
        if (adminData.city_id) {
            const city = await prisma_1.default.city.findUnique({
                where: { id: adminData.city_id }
            });
            if (!city) {
                throw new ApiError_1.ApiError(404, 'City not found', [], "CITY_NOT_FOUND");
            }
        }
        // Validate batch_id if provided and derive city_id
        if (adminData.batch_id) {
            const batch = await prisma_1.default.batch.findUnique({
                where: { id: adminData.batch_id }
            });
            if (!batch) {
                throw new ApiError_1.ApiError(404, 'Batch not found', [], "BATCH_NOT_FOUND");
            }
            // Automatically set city_id from batch if not explicitly provided
            if (!adminData.city_id) {
                adminData.city_id = batch.city_id;
            }
        }
        // Hash password
        const hashedPassword = await (0, hashPassword_1.hashPassword)(adminData.password);
        // Create admin
        const newAdmin = await prisma_1.default.admin.create({
            data: {
                name: adminData.name,
                email: adminData.email,
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
                        batch_name: true,
                        year: true,
                        city_id: true
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
        const { city_id, batch_id, role, search } = filters;
        // Build search filter
        let searchFilter = {};
        if (search) {
            searchFilter = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            };
        }
        const admins = await prisma_1.default.admin.findMany({
            where: {
                ...(city_id && { city_id: parseInt(city_id) }),
                ...(batch_id && { batch_id: parseInt(batch_id) }),
                ...(role && { role: role }),
                ...searchFilter
            },
            select: {
                id: true,
                name: true,
                email: true,
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
                        batch_name: true,
                        year: true,
                        city_id: true
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
            throw new ApiError_1.ApiError(404, 'Admin not found', [], "ADMIN_NOT_FOUND");
        }
        // Only allow specific field updates (name, email, role, batch_id, city_id)
        // Remove username from allowed updates
        const allowedUpdates = ['name', 'email', 'role', 'batch_id', 'city_id'];
        const invalidUpdates = Object.keys(updateData).filter(key => !allowedUpdates.includes(key));
        if (invalidUpdates.length > 0) {
            throw new ApiError_1.ApiError(400, `Only ${allowedUpdates.join(', ')} can be updated. Invalid fields: ${invalidUpdates.join(', ')}`, [], "VALIDATION_ERROR");
        }
        // Check for duplicate email if updating email
        if (updateData.email) {
            const duplicateCheck = await prisma_1.default.admin.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        { email: updateData.email }
                    ]
                }
            });
            if (duplicateCheck) {
                throw new ApiError_1.ApiError(400, 'Email already exists', [], "USER_EXISTS");
            }
        }
        // Validate city_id if provided
        if (updateData.city_id) {
            const city = await prisma_1.default.city.findUnique({
                where: { id: updateData.city_id }
            });
            if (!city) {
                throw new ApiError_1.ApiError(400, 'City not found');
            }
        }
        // Validate batch_id if provided and derive city_id
        if (updateData.batch_id) {
            const batch = await prisma_1.default.batch.findUnique({
                where: { id: updateData.batch_id }
            });
            if (!batch) {
                throw new ApiError_1.ApiError(400, 'Batch not found');
            }
            // Automatically set city_id from batch
            updateData.city_id = batch.city_id;
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
                        batch_name: true,
                        year: true,
                        city_id: true
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
            throw new ApiError_1.ApiError(400, 'Admin not found');
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
