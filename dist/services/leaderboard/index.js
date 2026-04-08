"use strict";
// Leaderboard Services
// Optimized and refactored implementation with caching
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLeaderboardError = exports.normalizeLeaderboardRow = exports.buildFromClause = exports.buildSelectClause = exports.clearMetadataCache = exports.getAvailableYears = exports.getCachedCityYearMapping = exports.getCachedYears = exports.buildLeaderboardBaseQueryByCityId = exports.buildLeaderboardBaseQuery = exports.getStudentLeaderboard = exports.getAdminLeaderboard = void 0;
var adminLeaderboard_service_1 = require("./adminLeaderboard.service");
Object.defineProperty(exports, "getAdminLeaderboard", { enumerable: true, get: function () { return adminLeaderboard_service_1.getAdminLeaderboard; } });
var studentLeaderboard_service_1 = require("./studentLeaderboard.service");
Object.defineProperty(exports, "getStudentLeaderboard", { enumerable: true, get: function () { return studentLeaderboard_service_1.getStudentLeaderboard; } });
var leaderboard_shared_1 = require("./leaderboard.shared");
Object.defineProperty(exports, "buildLeaderboardBaseQuery", { enumerable: true, get: function () { return leaderboard_shared_1.buildLeaderboardBaseQuery; } });
Object.defineProperty(exports, "buildLeaderboardBaseQueryByCityId", { enumerable: true, get: function () { return leaderboard_shared_1.buildLeaderboardBaseQueryByCityId; } });
Object.defineProperty(exports, "getCachedYears", { enumerable: true, get: function () { return leaderboard_shared_1.getCachedYears; } });
Object.defineProperty(exports, "getCachedCityYearMapping", { enumerable: true, get: function () { return leaderboard_shared_1.getCachedCityYearMapping; } });
Object.defineProperty(exports, "getAvailableYears", { enumerable: true, get: function () { return leaderboard_shared_1.getAvailableYears; } });
Object.defineProperty(exports, "clearMetadataCache", { enumerable: true, get: function () { return leaderboard_shared_1.clearMetadataCache; } });
Object.defineProperty(exports, "buildSelectClause", { enumerable: true, get: function () { return leaderboard_shared_1.buildSelectClause; } });
Object.defineProperty(exports, "buildFromClause", { enumerable: true, get: function () { return leaderboard_shared_1.buildFromClause; } });
Object.defineProperty(exports, "normalizeLeaderboardRow", { enumerable: true, get: function () { return leaderboard_shared_1.normalizeLeaderboardRow; } });
Object.defineProperty(exports, "handleLeaderboardError", { enumerable: true, get: function () { return leaderboard_shared_1.handleLeaderboardError; } });
