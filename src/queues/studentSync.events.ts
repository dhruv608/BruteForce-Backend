import { QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis";
import { completeSync } from "../utils/syncStatus";
import { clearBatchQuestions } from "../store/batchQuestions.store";

// Initialize QueueEvents for completion detection
export const studentSyncQueueEvents = new QueueEvents("student-sync", {
  connection: redisConnection,
});

// State for building the final report
let syncReport = {
  totalProcessed: 0,
  addedQuestionsCount: 0,
  studentsSkippedCount: 0,
  failedCount: 0,
  studentsWithAddedQuestions: [] as { id: number; added: number }[],
  errors: [] as { id: number; reason: string }[]
};

function resetReport() {
  syncReport = {
    totalProcessed: 0,
    addedQuestionsCount: 0,
    studentsSkippedCount: 0,
    failedCount: 0,
    studentsWithAddedQuestions: [],
    errors: []
  };
}

// Handle queue drained event (all jobs completed)
studentSyncQueueEvents.on("drained", async () => {
  console.log("\n==================================================");
  console.log("[SYNC REPORT] SYNCHRONIZATION CYCLE COMPLETED");
  console.log("==================================================");
  console.log(`Total Students Processed:     ${syncReport.totalProcessed}`);
  console.log(`Students w/ New Solved Qs:    ${syncReport.studentsWithAddedQuestions.length}`);
  console.log(`Total New Questions Added:    ${syncReport.addedQuestionsCount}`);
  console.log(`Students Skipped (Optimized): ${syncReport.studentsSkippedCount}`);
  console.log(`Students Failed / Errored:    ${syncReport.failedCount}`);
  console.log("--------------------------------------------------");
  
  if (syncReport.errors.length > 0) {
    console.log("[SYNC REPORT] ERRORS LOG:");
    syncReport.errors.forEach(err => {
      console.log(`   - Student ID: ${err.id} | Reason: ${err.reason}`);
    });
    console.log("--------------------------------------------------");
  }
  
  if (syncReport.studentsWithAddedQuestions.length > 0) {
    console.log("[SYNC REPORT] ADDED QUESTIONS LOG:");
    syncReport.studentsWithAddedQuestions.forEach(stu => {
      console.log(`   - Student ID: ${stu.id} | Added: ${stu.added}`);
    });
    console.log("--------------------------------------------------");
  }

  // Mark sync as completed
  completeSync();
  
  // NOTE: We do NOT clearBatchQuestions() here anymore.
  // Because if any jobs failed and went into 'delayed' for exponential backoff retry,
  // the 'drained' event still fires. If we clear the memory here, when those jobs
  // retry, they will find an empty memory store and instantly skip/fail.
  // The memory will cleanly overwrite itself at the start of the next cron cycle.
  
  // Reset report for next cron cycle
  resetReport();
  
  console.log("[SYNC] Sync cycle completed and memory cleared\n");
});

// Handle job completion for detailed logging
studentSyncQueueEvents.on("completed", ({ jobId, returnvalue }) => {
  syncReport.totalProcessed++;
  
  if (returnvalue) {
    try {
      // BullMQ QueueEvents often returns the value as a JSON string
      const res = typeof returnvalue === "string" ? JSON.parse(returnvalue) : returnvalue;
      
      if (res.status === "SUCCESS") {
        if (res.skipped) {
          syncReport.studentsSkippedCount++;
        } else {
          syncReport.addedQuestionsCount += res.newSolved;
          syncReport.studentsWithAddedQuestions.push({ id: res.studentId, added: res.newSolved });
        }
      } else if (res.status === "ERROR") {
        syncReport.failedCount++;
        syncReport.errors.push({ id: res.studentId, reason: res.reason });
      }
    } catch (e) {
      console.error(`Failed to parse returnvalue for job ${jobId}`, e);
    }
  }
});

// Handle job failures (Timeouts / Exceptions)
studentSyncQueueEvents.on("failed", ({ jobId, failedReason }) => {
  syncReport.totalProcessed++;
  syncReport.failedCount++;
  // Extracting student ID is hard here since job isn't fully available, 
  // but we can log the job ID.
  syncReport.errors.push({ id: -1, reason: `Job ${jobId} Failed: ${failedReason}` });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await studentSyncQueueEvents.close();
  console.log("[SYNC] Queue events closed");
});

process.on("SIGTERM", async () => {
  await studentSyncQueueEvents.close();
  console.log("[SYNC] Queue events closed");
});

export default studentSyncQueueEvents;
