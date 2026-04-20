import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import prisma from "../config/prisma";
import csv from "csv-parser";

interface BulkStudentProgressResult {
  message: string;
  summary: {
    totalRows: number;
    progressRecordsCreated: number;
    studentsNotFound: number;
    questionsNotFound: number;
    duplicatesSkipped: number;
  };
  errors: Array<{
    row: number;
    issue: string;
    question?: string;
    enrollment?: string;
  }>;
}

interface StudentProgressCSVRow {
  question_link: string;
  [key: string]: string; // For enrollment columns
}

export const bulkUploadStudentProgress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "CSV file is required");
  }

  const results: BulkStudentProgressResult = {
    message: "Student progress bulk upload completed",
    summary: {
      totalRows: 0,
      progressRecordsCreated: 0,
      studentsNotFound: 0,
      questionsNotFound: 0,
      duplicatesSkipped: 0
    },
    errors: []
  };

  const csvData: StudentProgressCSVRow[] = [];
  
  // Parse CSV
  await new Promise((resolve, reject) => {
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file!.buffer);
    
    bufferStream
      .pipe(csv())
      .on('data', (row: StudentProgressCSVRow) => {
        csvData.push(row);
      })
      .on('end', () => {
        resolve(csvData);
      })
      .on('error', (error: any) => {
        reject(error);
      });
  });

  results.summary.totalRows = csvData.length;

  if (csvData.length === 0) {
    throw new ApiError(400, "CSV file is empty or invalid");
  }

  // Get all unique enrollment IDs from CSV headers (excluding question_link)
  const enrollmentColumns = Object.keys(csvData[0]).filter(key => key !== 'question_link');
  
  // Pre-fetch all students by enrollment IDs
  const students = await prisma.student.findMany({
    where: {
      enrollment_id: {
        in: enrollmentColumns
      }
    },
    select: {
      id: true,
      enrollment_id: true
    }
  });

  const enrollmentToStudentMap = new Map(
    students.map(student => [student.enrollment_id, student.id])
  );

  // Check for missing enrollment IDs
  enrollmentColumns.forEach(enrollment => {
    if (!enrollmentToStudentMap.has(enrollment)) {
      results.summary.studentsNotFound++;
      results.errors.push({
        row: 0, // Header row issue
        issue: `Student with enrollment ID '${enrollment}' not found in database`,
        enrollment
      });
    }
  });

  // Process each row
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNum = i + 2; // +2 because header is row 1 and array is 0-indexed

    try {
      // Find question by link
      const question = await prisma.question.findUnique({
        where: { question_link: row.question_link.trim() }
      });

      if (!question) {
        results.summary.questionsNotFound++;
        results.errors.push({
          row: rowNum,
          issue: `Question not found in database: ${row.question_link}`,
          question: row.question_link
        });
        continue;
      }

      // Process each enrollment column
      for (const enrollment of enrollmentColumns) {
        const status = row[enrollment]?.trim();
        
        // Only process "Solved" entries
        if (status !== 'Solved') {
          continue;
        }

        const studentId = enrollmentToStudentMap.get(enrollment);
        if (!studentId) {
          // Already counted in header validation, skip
          continue;
        }

        // Check if progress record already exists
        const existingProgress = await prisma.studentProgress.findUnique({
          where: {
            student_id_question_id: {
              student_id: studentId,
              question_id: question.id
            }
          }
        });

        if (existingProgress) {
          results.summary.duplicatesSkipped++;
          continue;
        }

        try {
          // Create student progress record
          await prisma.studentProgress.create({
            data: {
              student_id: studentId,
              question_id: question.id,
              sync_at: new Date()
            }
          });
          results.summary.progressRecordsCreated++;
        } catch (error: any) {
          // Handle any unexpected errors
          results.errors.push({
            row: rowNum,
            issue: `Failed to create progress record for student ${enrollment}: ${error.message}`,
            enrollment
          });
        }
      }

    } catch (error: any) {
      results.errors.push({
        row: rowNum,
        issue: `Row processing failed: ${error.message}`,
        question: row.question_link
      });
    }
  }

  return res.json(results);
});
