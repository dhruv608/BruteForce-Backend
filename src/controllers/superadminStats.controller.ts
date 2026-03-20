import { Request, Response } from "express";
import { getSuperAdminStatsService } from "../services/superadminStats.service";

export const getSuperAdminStats = async (req: Request, res: Response) => {
    try {
        const stats = await getSuperAdminStatsService();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("System stats controller error:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch system statistics"
        });
    }
};
