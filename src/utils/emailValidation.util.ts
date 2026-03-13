// Email domain validation utility
export const validateEmailDomain = (email: string): boolean => {
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

// Extract domain from email
export const getEmailDomain = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  const parts = email.toLowerCase().split('@');
  return parts.length > 1 ? parts[1] : '';
};

// Validate email format and domain
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (!validateEmailDomain(email)) {
    return { isValid: false, error: 'Only @pwioi.com email addresses are allowed' };
  }
  
  return { isValid: true };
};
