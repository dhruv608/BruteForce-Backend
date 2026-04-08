"use strict";
/**
 * Cache Service
 *
 * Abstraction layer for caching with Redis-ready design.
 * Currently uses in-memory Map with TTL support.
 * Can be easily swapped for Redis in production.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheKeys = exports.cacheService = void 0;
class CacheService {
    constructor(defaultTTLSeconds = 300) {
        this.store = new Map();
        this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
    }
    /**
     * Get value from cache
     * @param key Cache key
     * @returns Cached value or null if expired/missing
     */
    async get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    /**
     * Set value in cache with TTL
     * @param key Cache key
     * @param value Value to cache
     * @param ttlSeconds TTL in seconds (optional, uses default if not provided)
     */
    async set(key, value, ttlSeconds) {
        const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
        const expiresAt = Date.now() + ttl;
        this.store.set(key, {
            value,
            expiresAt
        });
    }
    /**
     * Delete key from cache
     * @param key Cache key to delete
     */
    async del(key) {
        this.store.delete(key);
    }
    /**
     * Delete keys matching pattern
     * @param pattern Key pattern to match (e.g., "heatmap:123:*")
     */
    async delPattern(pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.store.keys()) {
            if (regex.test(key)) {
                this.store.delete(key);
            }
        }
    }
    /**
     * Clear all cached values
     */
    async clear() {
        this.store.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.store.size,
            keys: Array.from(this.store.keys())
        };
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}
// Global cache instance
exports.cacheService = new CacheService(300); // 5 minutes default TTL
// Key generators for consistent cache key naming
exports.cacheKeys = {
    heatmap: (studentId, batchId, startMonthISO) => `heatmap:${studentId}:${batchId}:${startMonthISO}`,
    batchStartMonth: (batchId) => `batch_start_month:${batchId}`,
    // NEW: Batch-level assigned dates (shared by all students in batch)
    batchAssignedDates: (batchId, startMonthISO) => `batch:assigned:${batchId}:${startMonthISO}`,
    // NEW: Batch-level submission counts cache (optional)
    studentSubmissionCounts: (studentId, startMonthISO) => `student:submissions:${studentId}:${startMonthISO}`
};
exports.default = exports.cacheService;
