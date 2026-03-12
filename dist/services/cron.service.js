"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerLeaderboardSync = exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const leaderboard_service_1 = require("../services/leaderboard.service");
// 🚀 Start Cron Jobs
const startCronJobs = () => {
    console.log('🕐 Starting cron jobs...');
    // Sync leaderboard cache every 4 hours
    node_cron_1.default.schedule('0 */4 * * *', async () => {
        try {
            console.log('⏰ Running scheduled leaderboard sync...');
            await (0, leaderboard_service_1.syncLeaderboardCache)();
            console.log('✅ Scheduled leaderboard sync completed');
        }
        catch (error) {
            console.error('❌ Scheduled leaderboard sync failed:', error);
        }
    });
    // Optional: Sync at midnight daily
    node_cron_1.default.schedule('0 0 * * *', async () => {
        try {
            console.log('🌙 Running midnight leaderboard sync...');
            await (0, leaderboard_service_1.syncLeaderboardCache)();
            console.log('✅ Midnight leaderboard sync completed');
        }
        catch (error) {
            console.error('❌ Midnight leaderboard sync failed:', error);
        }
    });
    console.log('✅ Cron jobs started successfully');
    console.log('📅 Leaderboard sync scheduled: Every 4 hours + Daily at midnight');
};
exports.startCronJobs = startCronJobs;
// Manual trigger for immediate sync
const triggerLeaderboardSync = async () => {
    try {
        console.log('🔄 Manual leaderboard sync triggered...');
        await (0, leaderboard_service_1.syncLeaderboardCache)();
        console.log('✅ Manual leaderboard sync completed');
        return { success: true, message: 'Leaderboard sync completed successfully' };
    }
    catch (error) {
        console.error('❌ Manual leaderboard sync failed:', error);
        return { success: false, message: 'Leaderboard sync failed', error: error.message };
    }
};
exports.triggerLeaderboardSync = triggerLeaderboardSync;
