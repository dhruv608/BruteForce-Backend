import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getCityWiseStats } from "../services/admin.service";
import { createAdminService, getAllAdminsService, updateAdminService, deleteAdminService } from "../services/admin.service";

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        // Get total counts
        const [
            totalCities,
            totalBatches,
            totalStudents,
            totalAdmins
        ] = await Promise.all([
            prisma.city.count(),
            prisma.batch.count(),
            prisma.student.count(),
            prisma.admin.count({
                where: { role: 'TEACHER' }
            })
        ]);

        // Get city-wise distribution
        const cityWiseDistribution = await getCityWiseStats();

        return res.status(200).json({
            success: true,
            data: {
                totalCities,
                totalBatches,
                totalAdmins,
                totalStudents,
                cityWiseDistribution
            }
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch admin statistics"
        });
    }
};

export const createAdminController = async (req: Request, res: Response) => {
    try {
        const adminData = req.body;

        // Validate required fields
        if (!adminData.name || !adminData.email || !adminData.username || !adminData.password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, email, username, password"
            });
        }

        const newAdmin = await createAdminService(adminData);

        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: newAdmin
        });

    } catch (error) {
        console.error("Create admin error:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to create admin"
        });
    }
};

export const getAllAdminsController = async (req: Request, res: Response) => {
    try {
        const filters = req.query;
        const admins = await getAllAdminsService(filters);

        return res.status(200).json({
            success: true,
            data: admins
        });

    } catch (error) {
        console.error("Get admins error:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch admins"
        });
    }
};

export const updateAdminController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!id || isNaN(parseInt(id as string))) {
            return res.status(400).json({
                success: false,
                message: "Valid admin ID is required"
            });
        }

        const updatedAdmin = await updateAdminService(parseInt(id as string), updateData);

        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin
        });

    } catch (error: any) {
        console.error("Update admin error:", error);
        const statusCode = error.message === 'Admin not found' ? 404 : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to update admin"
        });
    }
};

export const deleteAdminController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id as string))) {
            return res.status(400).json({
                success: false,
                message: "Valid admin ID is required"
            });
        }

        const result = await deleteAdminService(parseInt(id as string));

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error: any) {
        console.error("Delete admin error:", error);
        const statusCode = error.message === 'Admin not found' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to delete admin"
        });
    }
};
