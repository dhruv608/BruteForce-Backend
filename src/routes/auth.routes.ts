import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  loginAdmin,
  refreshToken,
} from '../controllers/auth.controller';
import { googleLogin } from "../controllers/auth.controller";
const router = Router();

// ===== STUDENT AUTH (Public) =====
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/refresh-token', refreshToken);
// ===== ADMIN AUTH (Public) =====
// Note: This is for ALL admins (Superadmin, Teacher, Intern)
router.post('/admin/login', loginAdmin);
router.post("/student/google", googleLogin);
// ===== OPTIONAL: Google OAuth (Add later) =====
// router.post('/google', googleOAuth);

export default router;
