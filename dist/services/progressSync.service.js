"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOneStudent = syncOneStudent;
const prisma_1 = __importDefault(require("../config/prisma"));
const leetcode_service_1 = require("./leetcode.service");
const gfg_service_1 = require("./gfg.service");
const ApiError_1 = require("../utils/ApiError");
function extractSlug(url) {
    return url.split("/problems/")[1]?.split("/")[0];
}
async function syncOneStudent(studentId, compareRealCount = true) {
    console.log(`Starting sync for student ${studentId}, compareRealCount: ${compareRealCount}`);
    // 1️⃣ Load student + already solved progress from StudentProgress table
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        include: {
            progress: {
                select: { question_id: true }
            }
        }
    });
    if (!student)
        throw new ApiError_1.ApiError(400, "Student not found");
    if (!student.batch_id)
        throw new ApiError_1.ApiError(400, "Student has no batch");
    console.log(`Student: ${student.name}, Batch: ${student.batch_id}`);
    console.log(`Current counts - LeetCode: ${student.lc_total_solved}, GFG: ${student.gfg_total_solved}`);
    console.log(`Already solved in our system: ${student.progress.length} questions`);
    // 2️⃣ Get batch questions through proper table relationships
    // Batch → Class → QuestionVisibility → Question
    const batchQuestions = await prisma_1.default.$queryRaw `
    SELECT DISTINCT q.id, q.question_link
    FROM "Question" q
    JOIN "QuestionVisibility" qv ON q.id = qv.question_id
    JOIN "Class" c ON qv.class_id = c.id
    WHERE c.batch_id = ${student.batch_id}
  `;
    console.log(`Found ${batchQuestions.length} unique questions in batch curriculum`);
    // 3️⃣ Build slug → questionId map for quick API slug to DB ID lookup
    const questionMap = new Map();
    batchQuestions.forEach(q => {
        const slug = extractSlug(q.question_link);
        if (slug) {
            questionMap.set(slug, q.id);
        }
    });
    console.log(`Built question map with ${questionMap.size} slug-to-ID mappings`);
    // 4️⃣ Already solved set to avoid duplicate progress entries
    const solvedSet = new Set(student.progress.map(p => p.question_id));
    console.log(`Solved set contains ${solvedSet.size} question IDs`);
    const newProgressEntries = [];
    // ===============================
    // LEETCODE API INTEGRATION
    // ===============================
    if (student.leetcode_id) {
        console.log(`Calling LeetCode API for user: ${student.leetcode_id}`);
        // API Response Structure:
        // {
        //   totalSolved: 150,           // Total solved on LeetCode platform
        //   submissions: [              // Recent submissions array
        //     { titleSlug: "two-sum", statusDisplay: "Accepted" },
        //     { titleSlug: "add-two-numbers", statusDisplay: "Wrong Answer" },
        //     { titleSlug: "merge-sorted-array", statusDisplay: "Accepted" }
        //   ]
        // }
        const lcData = await (0, leetcode_service_1.fetchLeetcodeData)(student.leetcode_id);
        console.log("LeetCode API Response:", {
            username: student.leetcode_id,
            totalSolved: lcData.totalSolved,
            studentTotalSolved: student.lc_total_solved,
            submissions: lcData.submissions.length
        });
        // LOGIC BRANCH: Compare real counts or process everything
        let shouldProcessLeetcode = true;
        if (compareRealCount) {
            // Only process if student solved new questions on platform
            shouldProcessLeetcode = lcData.totalSolved > student.lc_total_solved;
            console.log(`Count comparison: ${lcData.totalSolved} > ${student.lc_total_solved} = ${shouldProcessLeetcode}`);
        }
        else {
            console.log("Skipping count comparison, processing all submissions");
        }
        if (shouldProcessLeetcode) {
            // Process submissions - only "Accepted" ones count
            lcData.submissions
                .filter(sub => sub.statusDisplay === "Accepted")
                .forEach(sub => {
                // Match API slug with our question map
                const questionId = questionMap.get(sub.titleSlug);
                if (questionId && !solvedSet.has(questionId)) {
                    console.log(`New LeetCode solution: ${sub.titleSlug} -> Question ID: ${questionId}`);
                    newProgressEntries.push({
                        student_id: student.id,
                        question_id: questionId
                    });
                    solvedSet.add(questionId); // Add to solved set to avoid duplicates in this sync
                }
            });
        }
        else {
            console.log("Skipping LeetCode processing - no new solutions found");
        }
        // Always update real count in Student table
        await prisma_1.default.student.update({
            where: { id: student.id },
            data: {
                lc_total_solved: lcData.totalSolved,
                last_synced_at: new Date()
            }
        });
    }
    // ===============================
    // GEEKSFORGEEKS API INTEGRATION
    // ===============================
    if (student.gfg_id) {
        console.log(`Calling GFG API for user: ${student.gfg_id}`);
        // API Response Structure:
        // {
        //   totalSolved: 200,           // Total solved on GFG platform
        //   solvedSlugs: [              // Array of solved problem slugs
        //     "reverse-a-linked-list",
        //     "binary-search-tree",
        //     "dynamic-programming-knapsack"
        //   ]
        // }
        const gfgData = await (0, gfg_service_1.fetchGfgData)(student.gfg_id);
        console.log("GFG API Response:", {
            handle: student.gfg_id,
            totalSolved: gfgData.totalSolved,
            studentTotalSolved: student.gfg_total_solved,
            solvedSlugs: gfgData.solvedSlugs.length
        });
        // LOGIC BRANCH: Compare real counts or process everything
        let shouldProcessGfg = true;
        if (compareRealCount) {
            // Only process if student solved new questions on platform
            shouldProcessGfg = gfgData.totalSolved > student.gfg_total_solved;
            console.log(`Count comparison: ${gfgData.totalSolved} > ${student.gfg_total_solved} = ${shouldProcessGfg}`);
        }
        else {
            console.log("Skipping count comparison, processing all solved problems");
        }
        if (shouldProcessGfg) {
            // Process all solved slugs from GFG
            gfgData.solvedSlugs.forEach(slug => {
                // Match API slug with our question map
                const questionId = questionMap.get(slug);
                if (questionId && !solvedSet.has(questionId)) {
                    console.log(`New GFG solution: ${slug} -> Question ID: ${questionId}`);
                    newProgressEntries.push({
                        student_id: student.id,
                        question_id: questionId
                    });
                    solvedSet.add(questionId); // Add to solved set to avoid duplicates
                }
            });
        }
        else {
            console.log("Skipping GFG processing - no new solutions found");
        }
        // Always update real count in Student table
        await prisma_1.default.student.update({
            where: { id: student.id },
            data: {
                gfg_total_solved: gfgData.totalSolved,
                last_synced_at: new Date()
            }
        });
        console.log(`Updated GFG count: ${student.gfg_total_solved} -> ${gfgData.totalSolved}`);
    }
    // 5️⃣ Bulk Insert into StudentProgress table
    // Insert all new progress entries in one database query
    if (newProgressEntries.length > 0) {
        await prisma_1.default.studentProgress.createMany({
            data: newProgressEntries,
            skipDuplicates: true // Safety net to prevent any duplicates
        });
        console.log(`Inserted ${newProgressEntries.length} new progress entries`);
    }
    else {
        console.log("No new progress entries to insert");
    }
    return {
        message: "Sync completed",
        newSolved: newProgressEntries.length,
        hadNewSolutions: newProgressEntries.length > 0,
        compareRealCount: compareRealCount // Return which logic was used
    };
}
