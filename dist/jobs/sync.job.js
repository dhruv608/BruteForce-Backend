"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSyncJob = startSyncJob;
const node_cron_1 = __importDefault(require("node-cron"));
const sync_worker_1 = require("../workers/sync.worker");
function startSyncJob() {
    console.log("Sync cron job started");
    // */1 * * * *
    // cron.schedule("0 */4 * * *", async () => {
    // cron.schedule("*/1 * * * *", async () => {
    node_cron_1.default.schedule("* * * * *", async () => {
        console.log("Running student progress sync...");
        try {
            await (0, sync_worker_1.runStudentSyncWorker)();
        }
        catch (error) {
            console.error("Sync job failed:", error);
        }
    });
}
