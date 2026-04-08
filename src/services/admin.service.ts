import prisma from "../config/prisma";
import { hashPassword } from "../utils/hashPassword";
import { validatePasswordForAuth } from "../utils/passwordValidator.util";
import { AdminRole } from "@prisma/client";
import { ApiError } from "../utils/ApiError";


export const createAdminService = async (adminData: any) => {
    try {
        // Check if email already exists (removed username check)
        const existingAdmin = await prisma.admin.findFirst({
            where: {
                email: adminData.email
            }
        });

        if (existingAdmin) {
            throw new ApiError(400, 'Email already exists', [], "USER_EXISTS");
        }

        // Validate city_id if provided
        if (adminData.city_id) {
            const city = await prisma.city.findUnique({
                where: { id: adminData.city_id }
            });
            if (!city) {
                throw new ApiError(404, 'City not found', [], "CITY_NOT_FOUND");
            }
        }

        // Validate batch_id if provided and derive city_id
        if (adminData.batch_id) {
            const batch = await prisma.batch.findUnique({
                where: { id: adminData.batch_id }
            });
            if (!batch) {
                throw new ApiError(404, 'Batch not found', [], "BATCH_NOT_FOUND");
            }
            // Automatically set city_id from batch if not explicitly provided
            if (!adminData.city_id) {
                adminData.city_id = batch.city_id;
            }
        }

        // Validate password strength
        validatePasswordForAuth(adminData.password);

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
            throw new ApiError(404, 'Admin not found', [], "ADMIN_NOT_FOUND");
        }

        // Only allow specific field updates (name, email, role, batch_id, city_id)
        // Remove username from allowed updates
        const allowedUpdates = ['name', 'email', 'role', 'batch_id', 'city_id'];
        const invalidUpdates = Object.keys(updateData).filter(key => !allowedUpdates.includes(key));
        
        if (invalidUpdates.length > 0) {
            throw new ApiError(400, `Only ${allowedUpdates.join(', ')} can be updated. Invalid fields: ${invalidUpdates.join(', ')}`, [], "VALIDATION_ERROR");
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
                throw new ApiError(400, 'Email already exists', [], "USER_EXISTS");
            }
        }

        // Validate city_id if provided
        if (updateData.city_id) {
            const city = await prisma.city.findUnique({
                where: { id: updateData.city_id }
            });
            if (!city) {
                throw new ApiError(400, 'City not found');
            }
        }

        // Validate batch_id if provided and derive city_id
        if (updateData.batch_id) {
            const batch = await prisma.batch.findUnique({
                where: { id: updateData.batch_id }
            });
            if (!batch) {
                throw new ApiError(400, 'Batch not found');
            }
            // Automatically set city_id from batch
            updateData.city_id = batch.city_id;
        }

        // Hash password if provided
        if (updateData.password) {
            // Validate password strength
            validatePasswordForAuth(updateData.password);
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
            throw new ApiError(400, 'Admin not found');
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



export const getCurrentAdminService = async (adminId: number) => {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      city_id: true,
      batch_id: true,
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
          year: true
        }
      },
      created_at: true
    }
  });

  if (!admin) {
    throw new ApiError(404, "Admin not found", [], "ADMIN_NOT_FOUND");
  }

  return admin;
};






export const getAdminStatsService = async (batchId: number) => {
  // Check if batch exists
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      city: {
        select: {
          city_name: true
        }
      }
    }
  });

  if (!batch) {
    throw new ApiError(404, "Batch not found", [], "BATCH_NOT_FOUND");
  }

  // Parallelize independent count queries
  const [totalClassesResult, totalStudentsResult, totalTopicsResult, questionStatsResult] = await Promise.all([
    // Total classes for this batch
    prisma.class.count({
      where: { batch_id: batchId }
    }),

    // Total students for this batch
    prisma.student.count({
      where: { batch_id: batchId }
    }),

    // Total topics discussed (distinct topic_ids from classes in this batch)
    prisma.$queryRaw<{ count: BigInt }[]>`
      SELECT COUNT(DISTINCT topic_id) as count
      FROM "Class"
      WHERE batch_id = ${batchId}
    `,

    // All question aggregations in single SQL query with FILTER
    prisma.$queryRaw<{ total_questions: BigInt; homework: BigInt; classwork: BigInt; easy: BigInt; medium: BigInt; hard: BigInt; leetcode: BigInt; gfg: BigInt; other: BigInt; interviewbit: BigInt; }[]>`
      SELECT 
        COUNT(*) as total_questions,
        COUNT(*) FILTER (WHERE qv.type = 'HOMEWORK') as homework,
        COUNT(*) FILTER (WHERE qv.type = 'CLASSWORK') as classwork,
        COUNT(*) FILTER (WHERE q.level = 'EASY') as easy,
        COUNT(*) FILTER (WHERE q.level = 'MEDIUM') as medium,
        COUNT(*) FILTER (WHERE q.level = 'HARD') as hard,
        COUNT(*) FILTER (WHERE q.platform = 'LEETCODE') as leetcode,
        COUNT(*) FILTER (WHERE q.platform = 'GFG') as gfg,
        COUNT(*) FILTER (WHERE q.platform = 'OTHER') as other,
        COUNT(*) FILTER (WHERE q.platform = 'INTERVIEWBIT') as interviewbit
      FROM "QuestionVisibility" qv
      JOIN "Class" c ON qv.class_id = c.id
      JOIN "Question" q ON qv.question_id = q.id
      WHERE c.batch_id = ${batchId}
    `
  ]);

  // Convert BigInt results to Number (PostgreSQL COUNT returns BIGINT)
  const stats = questionStatsResult[0];

  return {
    batch_id: batchId,
    batch_name: batch.batch_name,
    city: batch.city.city_name,
    year: batch.year,
    total_classes: totalClassesResult,
    total_questions: Number(stats.total_questions),
    total_students: totalStudentsResult,
    questions_by_type: {
      homework: Number(stats.homework),
      classwork: Number(stats.classwork)
    },
    questions_by_level: {
      easy: Number(stats.easy),
      medium: Number(stats.medium),
      hard: Number(stats.hard)
    },
    questions_by_platform: {
      leetcode: Number(stats.leetcode),
      gfg: Number(stats.gfg),
      other: Number(stats.other),
      interviewbit: Number(stats.interviewbit)
    },
    total_topics_discussed: Number(totalTopicsResult[0].count)
  };
};