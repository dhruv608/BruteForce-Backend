import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  loginAdmin,
  logoutStudent,
  logoutAdmin,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyOtp,
} from '../controllers/auth.controller';
import { passwordResetLimiter, otpLimiter } from '../utils/rateLimit.util';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateBody } from '../middlewares/validate.middleware';
import {
  registerStudentSchema,
  loginStudentSchema,
  loginAdminSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

// ===== STUDENT AUTH (Public) =====
router.post('/student/register', authLimiter, validateBody(registerStudentSchema), registerStudent);
router.post('/student/login', authLimiter, validateBody(loginStudentSchema), loginStudent);
router.post('/student/logout', logoutStudent);

// ===== ADMIN AUTH (Public) =====
// Note: This is for ALL admins (Superadmin, Teacher, Intern)
router.post('/admin/login', authLimiter, validateBody(loginAdminSchema), loginAdmin);
router.post('/admin/logout', logoutAdmin);

// ===== TOKEN REFRESH (Public) =====
router.post('/refresh-token',   refreshToken);

// ===== PASSWORD RESET (Public) =====
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', authLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

// ===== GOOGLE OAUTH (Public) =====
router.post('/google-login',   googleLogin);

export default router;
