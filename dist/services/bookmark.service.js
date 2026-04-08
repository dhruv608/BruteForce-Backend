"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookmarkService = exports.updateBookmarkService = exports.addBookmarkService = exports.getBookmarksService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const errorMapper_1 = require("../utils/errorMapper");
// ==============================
// GET ALL BOOKMARKS WITH PAGINATION (OPTIMIZED)
// ==============================
const getBookmarksService = async (studentId, options) => {
    try {
        const { page = 1, limit = 10, sort = 'recent', filter = 'all' } = options;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // OPTIMIZED: Simple where clause - only filter by student_id
        // Removed: correlated subqueries for solved/unsolved filter
        const whereClause = { student_id: studentId };
        // OPTIMIZED: Simple orderBy - only by created_at
        // Removed: complex orderBy with progress.some/none
        const orderBy = sort === 'old'
            ? { created_at: 'asc' }
            : { created_at: 'desc' }; // 'recent', 'solved', 'unsolved' all use created_at desc
        // Calculate total count (fast with index on student_id)
        const totalCount = await prisma_1.default.bookmark.count({ where: whereClause });
        // For filter=solved/unsolved, we need a buffer to ensure we return 'take' items
        // after JS filtering. Fetch 3x the limit as a reasonable buffer.
        const needsJsFilter = filter === 'solved' || filter === 'unsolved';
        const needsJsSort = sort === 'solved' || sort === 'unsolved';
        const dbTake = needsJsFilter ? take * 3 : take;
        const dbSkip = needsJsFilter ? 0 : skip; // When filtering in JS, start from beginning and paginate in JS
        // Fetch bookmarks with simple, fast query
        const bookmarks = await prisma_1.default.bookmark.findMany({
            where: whereClause,
            include: {
                question: {
                    select: {
                        id: true,
                        question_name: true,
                        question_link: true,
                        platform: true,
                        level: true,
                        progress: {
                            where: {
                                student_id: studentId
                            },
                            select: {
                                id: true
                            }
                        }
                    }
                }
            },
            orderBy,
            skip: dbSkip,
            take: dbTake
        });
        // Format bookmarks with isSolved computed in JS
        let formattedBookmarks = bookmarks.map(bookmark => ({
            id: bookmark.id,
            question: bookmark.question,
            description: bookmark.description,
            created_at: bookmark.created_at,
            isSolved: bookmark.question.progress.length > 0
        }));
        // JS-LEVEL FILTER: Apply solved/unsolved filter in memory (fast for typical bookmark counts)
        if (filter === 'solved') {
            formattedBookmarks = formattedBookmarks.filter(b => b.isSolved);
        }
        else if (filter === 'unsolved') {
            formattedBookmarks = formattedBookmarks.filter(b => !b.isSolved);
        }
        // JS-LEVEL SORT: Apply solved/unsolved sorting in memory
        if (sort === 'solved') {
            // Solved first, then by created_at desc
            formattedBookmarks.sort((a, b) => {
                if (a.isSolved === b.isSolved) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return a.isSolved ? -1 : 1;
            });
        }
        else if (sort === 'unsolved') {
            // Unsolved first, then by created_at desc
            formattedBookmarks.sort((a, b) => {
                if (a.isSolved === b.isSolved) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return a.isSolved ? 1 : -1;
            });
        }
        // Apply pagination in JS if we were filtering/sorting in JS
        let paginatedBookmarks = formattedBookmarks;
        if (needsJsFilter || needsJsSort) {
            paginatedBookmarks = formattedBookmarks.slice(skip, skip + take);
        }
        // Calculate pagination info
        // For filtered results, total is approximate (based on all bookmarks)
        // For accurate filtered total, we'd need to scan all bookmarks
        const effectiveTotal = needsJsFilter ? formattedBookmarks.length : totalCount;
        const totalPages = Math.ceil(effectiveTotal / take);
        const hasNextPage = Number(page) < totalPages;
        const hasPreviousPage = Number(page) > 1;
        return {
            bookmarks: paginatedBookmarks,
            pagination: {
                page: Number(page),
                limit: take,
                total: effectiveTotal,
                totalPages,
                hasNextPage,
                hasPreviousPage
            }
        };
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Student not found");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch bookmarks");
    }
};
exports.getBookmarksService = getBookmarksService;
// ==============================
// ADD BOOKMARK
// ==============================
const addBookmarkService = async (studentId, questionId, description) => {
    try {
        // Check if student exists
        const student = await prisma_1.default.student.findUnique({
            where: { id: studentId }
        });
        if (!student) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Student not found");
        }
        // Check if question exists
        const question = await prisma_1.default.question.findUnique({
            where: { id: questionId }
        });
        if (!question) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Question not found");
        }
        // Check if already bookmarked
        const existingBookmark = await prisma_1.default.bookmark.findUnique({
            where: {
                student_id_question_id: {
                    student_id: studentId,
                    question_id: questionId
                }
            }
        });
        if (existingBookmark) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Question already bookmarked");
        }
        // Create bookmark
        const bookmark = await prisma_1.default.bookmark.create({
            data: {
                student_id: studentId,
                question_id: questionId,
                description: description || null
            },
            select: {
                id: true,
                question_id: true,
                description: true,
                created_at: true
            }
        });
        return bookmark;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.CONFLICT, "Question already bookmarked");
            }
            if (error.code === "P2003") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.BAD_REQUEST, "Invalid student or question reference");
            }
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Student or question not found");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to add bookmark");
    }
};
exports.addBookmarkService = addBookmarkService;
// ==============================
// UPDATE BOOKMARK DESCRIPTION
// ==============================
const updateBookmarkService = async (studentId, questionId, description) => {
    try {
        // Check if bookmark exists
        const existingBookmark = await prisma_1.default.bookmark.findUnique({
            where: {
                student_id_question_id: {
                    student_id: studentId,
                    question_id: questionId
                }
            }
        });
        if (!existingBookmark) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Bookmark not found");
        }
        // Update bookmark
        const bookmark = await prisma_1.default.bookmark.update({
            where: {
                student_id_question_id: {
                    student_id: studentId,
                    question_id: questionId
                }
            },
            data: {
                description,
                updated_at: new Date()
            },
            select: {
                id: true,
                question_id: true,
                description: true,
                created_at: true,
                updated_at: true
            }
        });
        return bookmark;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Bookmark not found");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update bookmark");
    }
};
exports.updateBookmarkService = updateBookmarkService;
// ==============================
// DELETE BOOKMARK
// ==============================
const deleteBookmarkService = async (studentId, questionId) => {
    try {
        // Check if bookmark exists
        const existingBookmark = await prisma_1.default.bookmark.findUnique({
            where: {
                student_id_question_id: {
                    student_id: studentId,
                    question_id: questionId
                }
            }
        });
        if (!existingBookmark) {
            throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Bookmark not found");
        }
        // Delete bookmark
        await prisma_1.default.bookmark.delete({
            where: {
                student_id_question_id: {
                    student_id: studentId,
                    question_id: questionId
                }
            }
        });
        return true;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.NOT_FOUND, "Bookmark not found");
            }
        }
        throw new ApiError_1.ApiError(errorMapper_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete bookmark");
    }
};
exports.deleteBookmarkService = deleteBookmarkService;
