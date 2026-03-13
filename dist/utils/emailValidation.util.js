"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = exports.getEmailDomain = exports.validateEmailDomain = void 0;
// Email domain validation utility
const validateEmailDomain = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return false;
    }
    // Check if email ends with @pwioi.com
    return email.toLowerCase().endsWith('@pwioi.com');
};
exports.validateEmailDomain = validateEmailDomain;
// Extract domain from email
const getEmailDomain = (email) => {
    if (!email || typeof email !== 'string') {
        return '';
    }
    const parts = email.toLowerCase().split('@');
    return parts.length > 1 ? parts[1] : '';
};
exports.getEmailDomain = getEmailDomain;
// Validate email format and domain
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }
    if (!(0, exports.validateEmailDomain)(email)) {
        return { isValid: false, error: 'Only @pwioi.com email addresses are allowed' };
    }
    return { isValid: true };
};
exports.validateEmail = validateEmail;
