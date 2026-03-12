"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBatchSlug = void 0;
const slugify_1 = __importDefault(require("slugify"));
const generateBatchSlug = (city, batchName, year) => {
    return `${city}-${(0, slugify_1.default)(batchName, {
        lower: true,
        strict: true,
    })}-${year}`;
};
exports.generateBatchSlug = generateBatchSlug;
