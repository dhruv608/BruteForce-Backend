import cron from 'node-cron';
import { syncLeaderboardCache } from '../services/leaderboard.service';

// 🚀 Start Cron Jobs
export const startCronJobs = () => {
    console.log('🕐 Starting cron jobs...');

    // Sync leaderboard cache every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        try {
            console.log('⏰ Running scheduled leaderboard sync...');
            await syncLeaderboardCache();
            console.log('✅ Scheduled leaderboard sync completed');
        } catch (error) {
            console.error('❌ Scheduled leaderboard sync failed:', error);
        }
    });

    // Optional: Sync at midnight daily
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('🌙 Running midnight leaderboard sync...');
            await syncLeaderboardCache();
            console.log('✅ Midnight leaderboard sync completed');
        } catch (error) {
            console.error('❌ Midnight leaderboard sync failed:', error);
        }
    });

    console.log('✅ Cron jobs started successfully');
    console.log('📅 Leaderboard sync scheduled: Every 4 hours + Daily at midnight');
};

// Manual trigger for immediate sync
export const triggerLeaderboardSync = async () => {
    try {
        console.log('🔄 Manual leaderboard sync triggered...');
        await syncLeaderboardCache();
        console.log('✅ Manual leaderboard sync completed');
        return { success: true, message: 'Leaderboard sync completed successfully' };
    } catch (error) {
        console.error('❌ Manual leaderboard sync failed:', error);
        return { success: false, message: 'Leaderboard sync failed', error: (error as any).message };
    }
};
