import prisma from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

export const getSuperAdminStatsService = async () => {
    try {
        const [
            totalCities,
            totalBatches,
            totalAdmins,
            citiesWithBatches
        ] = await Promise.all([
            prisma.city.count(),
            prisma.batch.count(),
            (prisma as any).admin.count({
                where: {
                    role: 'TEACHER'
                }
            }),
            prisma.city.findMany({
                select: {
                    id: true,
                    city_name: true,
                    _count: {
                        select: {
                            batches: true
                        }
                    }
                }
            })
        ]);

        // Format city breakdown for chart
        const cityBreakdown = citiesWithBatches
            .map(city => ({
                name: city.city_name,
                count: city._count.batches
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalCities,
            totalBatches,
            totalAdmins,
            cityBreakdown
        };
    } catch (error) {
        console.error("System stats error:", error);
        throw new ApiError(400, "Failed to fetch system statistics");
    }
};

export const getCurrentSuperAdminService = async (adminId: number) => {
  const superadmin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!superadmin) {
    throw new ApiError(404, "SuperAdmin not found");
  }

  return superadmin;
};