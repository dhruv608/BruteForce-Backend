"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSyncJob = startSyncJob;
const node_cron_1 = __importDefault(require("node-cron"));
const sync_worker_1 = require("../workers/sync.worker");
const leaderboard_service_1 = require("../services/leaderboard.service");
function startSyncJob() {
    console.log("Sync cron job started");
    // */1 * * * *
    node_cron_1.default.schedule("0 */4 * * *", async () => {
        // cron.schedule("*/1 * * * *", async () => {
        // cron.schedule("* * * * *", async () => {
        console.log("Running student progress sync...");
        try {
            await (0, sync_worker_1.runStudentSyncWorker)();
        }
        catch (error) {
            console.error("Student sync job failed:", error);
        }
    });
    // 🚀 Leaderboard cache sync every 4 hours
    node_cron_1.default.schedule("0 */4 * * *", async () => {
        // cron.schedule("* * * * *", async () => {
        console.log("⏰ Running scheduled leaderboard sync...");
        try {
            await (0, leaderboard_service_1.syncLeaderboardCache)();
            console.log("✅ Scheduled leaderboard sync completed");
        }
        catch (error) {
            console.error("❌ Leaderboard sync job failed:", error);
        }
    });
    // // Optional: Midnight leaderboard sync for daily refresh
    // cron.schedule("0 0 * * *", async () => {
    //   console.log("🌙 Running midnight leaderboard sync...");
    //   try {
    //     await syncLeaderboardCache();
    //     console.log("✅ Midnight leaderboard sync completed");
    //   } catch (error) {
    //     console.error("❌ Midnight leaderboard sync failed:", error);
    //   }
    // });
    // console.log("✅ All cron jobs started successfully");
    // console.log("📅 Student sync: Every minute");
    // console.log("📅 Leaderboard sync: Every 4 hours + Daily at midnight");
}
