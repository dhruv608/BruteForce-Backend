import cron from "node-cron";
import { runStudentSyncWorker } from "../workers/sync.worker";
import { syncLeaderboardCache } from "../services/leaderboard.service";

export function startSyncJob() {

  console.log("Sync cron job started");
  // */1 * * * *
  cron.schedule("0 */4 * * *", async () => {
  // cron.schedule("*/1 * * * *", async () => {
  // cron.schedule("* * * * *", async () => {
    console.log("Running student progress sync...");

    try {
      await runStudentSyncWorker();
    } catch (error) {
      console.error("Student sync job failed:", error);
    }
  });

  // 🚀 Leaderboard cache sync every 4 hours
  cron.schedule("0 */4 * * *", async () => {
  // cron.schedule("* * * * *", async () => {
    console.log("⏰ Running scheduled leaderboard sync...");

    try {
      await syncLeaderboardCache();
      console.log("✅ Scheduled leaderboard sync completed");
    } catch (error) {
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