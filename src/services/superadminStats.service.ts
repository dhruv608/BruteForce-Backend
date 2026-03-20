import prisma from "../config/prisma";

export const getSuperAdminStatsService = async () => {
    try {
        const [
            totalCities,
            totalBatches,
            totalAdmins,
            
        ] = await Promise.all([
            prisma.city.count(),
            prisma.batch.count(),
            (prisma as any).admin.count({
                where: {
                    role: 'TEACHER'
                }
            }),
            
        ]);

        return {
            totalCities,
            totalBatches,
            totalAdmins,
            
        };
    } catch (error) {
        console.error("System stats error:", error);
        throw new Error("Failed to fetch system statistics");
        
    }
};

