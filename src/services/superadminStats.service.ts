import prisma from "../config/prisma";

export const getSuperAdminStatsService = async () => {
    try {
        const [
            totalCities,
            totalBatches,
            totalAdmins,
            totalStudents,
            totalQuestions,
            totalTopics
        ] = await Promise.all([
            prisma.city.count(),
            prisma.batch.count(),
            (prisma as any).admin.count({
                where: {
                    role: 'TEACHER'
                }
            }),
            prisma.student.count(),
            prisma.question.count(),
            prisma.topic.count()
        ]);

        return {
            totalCities,
            totalBatches,
            totalAdmins,
            totalStudents,
            totalQuestions,
            totalTopics
        };
    } catch (error) {
        console.error("System stats error:", error);
        throw new Error("Failed to fetch system statistics");
    }
};

