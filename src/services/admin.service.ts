import prisma from "../config/prisma";
import { hashPassword } from "../utils/hashPassword";
import { AdminRole } from "@prisma/client";

export const getCityWiseStats = async () => {
    try {
        const cities = await prisma.city.findMany({
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

        const cityWiseDistribution = await Promise.all(
            cities.map(async (city) => {
                const batchIds = city.batches.map((batch: any) => batch.id);
                
                const [activeBatches, totalStudents] = await Promise.all([
                    prisma.batch.count({
                        where: {
                            city_id: city.id,
                            id: { in: batchIds }
                        }
                    }),
                    prisma.student.count({
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
            })
        );

        return cityWiseDistribution;
    } catch (error) {
        console.error("City-wise stats error:", error);
        throw error;
    }
};

export const createAdminService = async (adminData: any) => {
    try {
        // Check if email already exists (removed username check)
        const existingAdmin = await prisma.admin.findFirst({
            where: {
                email: adminData.email
            }
        });

        if (existingAdmin) {
            throw new Error('Email already exists');
        }

        // Validate city_id if provided
        if (adminData.city_id) {
            const city = await prisma.city.findUnique({
                where: { id: adminData.city_id }
            });
            if (!city) {
                throw new Error('City not found');
            }
        }

        // Validate batch_id if provided
        if (adminData.batch_id) {
            const batch = await prisma.batch.findUnique({
                where: { id: adminData.batch_id }
            });
            if (!batch) {
                throw new Error('Batch not found');
            }
        }

        // Hash password
        const hashedPassword = await hashPassword(adminData.password);

        // Create admin
        const newAdmin = await prisma.admin.create({
            data: {
                name: adminData.name,
                email: adminData.email,
                password_hash: hashedPassword,
                role: adminData.role as AdminRole,
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

    } catch (error) {
        console.error("Create admin error:", error);
        throw error;
    }
};

export const getAllAdminsService = async (filters: any = {}) => {
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

        const admins = await prisma.admin.findMany({
            where: {
                ...(city_id && { city_id: parseInt(city_id) }),
                ...(batch_id && { batch_id: parseInt(batch_id) }),
                ...(role && { role: role as AdminRole }),
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
                        batch_name: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return admins;

    } catch (error) {
        console.error("Get admins error:", error);
        throw error;
    }
};

export const updateAdminService = async (id: number, updateData: any) => {
    try {
        // Check if admin exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { id }
        });

        if (!existingAdmin) {
            throw new Error('Admin not found');
        }

        // Only allow specific field updates (name, email, role, batch_id, city_id)
        // Remove username from allowed updates
        const allowedUpdates = ['name', 'email', 'role', 'batch_id', 'city_id'];
        const invalidUpdates = Object.keys(updateData).filter(key => !allowedUpdates.includes(key));
        
        if (invalidUpdates.length > 0) {
            throw new Error(`Only ${allowedUpdates.join(', ')} can be updated. Invalid fields: ${invalidUpdates.join(', ')}`);
        }

        // Check for duplicate email if updating email
        if (updateData.email) {
            const duplicateCheck = await prisma.admin.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        { email: updateData.email }
                    ]
                }
            });

            if (duplicateCheck) {
                throw new Error('Email already exists');
            }
        }

        // Validate city_id if provided
        if (updateData.city_id) {
            const city = await prisma.city.findUnique({
                where: { id: updateData.city_id }
            });
            if (!city) {
                throw new Error('City not found');
            }
        }

        // Validate batch_id if provided
        if (updateData.batch_id) {
            const batch = await prisma.batch.findUnique({
                where: { id: updateData.batch_id }
            });
            if (!batch) {
                throw new Error('Batch not found');
            }
        }

        // Hash password if provided
        if (updateData.password) {
            updateData.password_hash = await hashPassword(updateData.password);
            delete updateData.password; // Remove plain password
        }

        // Update admin
        const updatedAdmin = await prisma.admin.update({
            where: { id },
            data: {
                ...updateData,
                ...(updateData.role && { role: updateData.role as AdminRole })
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

    } catch (error) {
        console.error("Update admin error:", error);
        throw error;
    }
};

export const deleteAdminService = async (id: number) => {
    try {
        // Check if admin exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { id }
        });

        if (!existingAdmin) {
            throw new Error('Admin not found');
        }

        // Delete admin
        await prisma.admin.delete({
            where: { id }
        });

        return { message: 'Admin deleted successfully' };

    } catch (error) {
        console.error("Delete admin error:", error);
        throw error;
    }
};
