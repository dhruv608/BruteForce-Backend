import prisma from '../config/prisma';
import { createAdminService } from './admin.service';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { OAuth2Client } from 'google-auth-library';
import { generateOTP, saveOTP, validateOTP } from '../utils/otp.util';
import { sendOTPEmail } from '../utils/email.util';
import { validateEmail } from '../utils/emailValidation.util';
import { validatePasswordForAuth } from '../utils/passwordValidator.util';
import { ApiError } from '../utils/ApiError';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export const registerAdmin = async (data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  city_id?: number;
  batch_id?: number;
  currentUserRole?: string;
}) => {
  const { currentUserRole, ...adminData } = data;

  // Only SUPERADMIN can create admins
  if (currentUserRole !== 'SUPERADMIN') {
    throw new ApiError(403, 'Only Super Admin can register new admins', [], "FORBIDDEN");
  }

  // Create admin using the existing service
  const admin = await createAdminService(adminData);

  // Generate tokens
  const accessToken = generateAccessToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    userType: 'admin',
  });

  const refreshToken = generateRefreshToken({
    id: admin.id,
    userType: 'admin',
  });

  // Update refresh token in database
  await prisma.admin.update({
    where: { id: admin.id },
    data: { refresh_token: refreshToken },
  });

  return {
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    accessToken,
    refreshToken
  };
};

export const registerStudent = async (data: {
  name: string;
  email: string;
  username: string;
  password: string;
  enrollment_id?: string;
  batch_id: number;
  leetcode_id?: string;
  gfg_id?: string;
}) => {
  const { name, email, username, password, enrollment_id, batch_id, leetcode_id, gfg_id } = data;

  // Validation
  if (!name || !email || !username || !password || !batch_id) {
    throw new ApiError(400, 'Name, email, username, password, and batch_id are required', [], "REQUIRED_FIELD");
  }

  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error, [], "INVALID_EMAIL");
  }

  // Check existing user
  const existingStudent = await prisma.student.findFirst({
    where: {
      OR: [{ email }, { username }, { enrollment_id }],
    },
  });

  if (existingStudent) {
    throw new ApiError(400, 'Email, username, or enrollment_id already exists', [], "USER_EXISTS");
  }

  // Get batch information to fetch city_id
  const batch = await prisma.batch.findUnique({
    where: { id: batch_id },
    include: { city: true }
  });

  if (!batch) {
    throw new ApiError(400, 'Invalid batch_id', [], "BATCH_NOT_FOUND");
  }

  // Validate password strength
  validatePasswordForAuth(password);

  // Hash password
  const password_hash = await hashPassword(password);

  // Create student
  const student = await prisma.student.create({
    data: {
      name,
      email,
      username,
      password_hash,
      enrollment_id,
      batch_id,
      city_id: batch.city_id,
      leetcode_id,
      gfg_id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      enrollment_id: true,
      batch_id: true,
      city_id: true,
      leetcode_id: true,
      gfg_id: true,
      created_at: true,
      batch: {
        select: {
          id: true,
          batch_name: true,
          slug: true,
          year: true
        }
      },
      city: {
        select: {
          id: true,
          city_name: true
        }
      }
    },
  });

  return student;
};

export const loginStudent = async (credentials: {
  email?: string;
  username?: string;
  password: string;
}) => {
  const { email, username, password } = credentials;

  if ((!email && !username) || !password) {
    throw new ApiError(400, 'Either email or username with password are required');
  }

  // Validate email domain if email is provided
  if (email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new ApiError(400, emailValidation.error);
    }
  }

  // Find student by email or username
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        email ? { email } : {},
        username ? { username } : {}
      ]
    },
    include: {
      city: true,
      batch: true,
    },
  });

  if (!student || !student.password_hash) {
    throw new ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
  }

  // Compare password
  const isValidPassword = await comparePassword(password, student.password_hash);

  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
  }

  const accessToken = generateAccessToken({
    id: student.id,
    email: student.email,
    role: 'STUDENT',
    userType: 'student',
    ...(student.batch && student.city && {
      batchId: student.batch.id,
      batchName: student.batch.batch_name,
      batchSlug: student.batch.slug,
      cityId: student.city.id,
      cityName: student.city.city_name,
    }),
  });

  const refreshToken = generateRefreshToken({
    id: student.id,
    userType: 'student',
  });

  // Update refresh token in database
  await prisma.student.update({
    where: { id: student.id },
    data: { refresh_token: refreshToken },
  });

  return {
    user: {
      id: student.id,
      name: student.name,
      email: student.email,
      username: student.username,
      city: student.city,
      batch: student.batch,
      leetcode_id: student.leetcode_id,
      gfg_id: student.gfg_id,
      cityId: student.city_id,
      cityName: student.city?.city_name || null,
      batchId: student.batch_id,
      batchName: student.batch?.batch_name || null,
      batchSlug: student.batch?.slug || null
    },
    accessToken,
    refreshToken
  };
};



export const loginAdmin = async (credentials: {
  email: string;
  password: string;
}) => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
    include: {
      batch: {
        select: {
          id: true,
          batch_name: true,
          city: {
            select: {
              id: true,
              city_name: true
            }
          }
        }
      }
    }
  });

  if (!admin || !admin.password_hash) {
    throw new ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
  }

  const isValidPassword = await comparePassword(password, admin.password_hash);

  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid credentials', [], "INVALID_CREDENTIALS");
  }

  const accessToken = generateAccessToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    userType: 'admin',
    ...(admin.batch && admin.batch.city && {
      batchId: admin.batch.id,
      batchName: admin.batch.batch_name,
      cityId: admin.batch.city.id,
      cityName: admin.batch.city.city_name,
    }),
  });

  const refreshToken = generateRefreshToken({
    id: admin.id,
    userType: 'admin',
  });

  // Update refresh token in database
  await prisma.admin.update({
    where: { id: admin.id },
    data: { refresh_token: refreshToken },
  });

  return {
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    accessToken,
    refreshToken
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token required');
  }

  const decoded = verifyRefreshToken(refreshToken);

  let user: any;

  if (decoded.userType === 'admin') {
    user = await prisma.admin.findUnique({
      where: { id: decoded.id },
      include: {
        batch: {
          select: { id: true, batch_name: true, city: { select: { id: true, city_name: true } } }
        }
      }
    });
  } else {
    user = await prisma.student.findUnique({
      where: { id: decoded.id },
      include: {
        batch: true,
        city: true
      }
    });
  }

  if (!user || user.refresh_token !== refreshToken) {
    throw new ApiError(403, 'Invalid refresh token', [], "INVALID_TOKEN");
  }

  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: decoded.userType === 'admin' ? user.role : 'STUDENT',
    userType: decoded.userType,
    ...(user.batch && decoded.userType === 'admin' && user.batch.city && {
      batchId: user.batch.id,
      batchName: user.batch.batch_name,
      cityId: user.batch.city.id,
      cityName: user.batch.city.city_name,
    }),
    ...(user.batch && decoded.userType === 'student' && user.city && {
      batchId: user.batch.id,
      batchName: user.batch.batch_name,
      batchSlug: user.batch.slug,
      cityId: user.city.id,
      cityName: user.city.city_name,
    }),
  });

  return { accessToken: newAccessToken };
};

export const googleAuth = async (idToken: string) => {
  if (!idToken) {
    throw new ApiError(400, "ID token required");
  }

  // Verify token with Google
  async function verifyIdToken(idToken: string) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      return payload;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      console.error("Google Auth Library verifyIdToken Error:", error.message);
      throw new ApiError(400, 'Failed to verify Google token: ' + error.message);
    }
  }

  const payload = await verifyIdToken(idToken);

  if (!payload?.email) {
    throw new ApiError(400, "Invalid Google token");
  }

  const email = payload.email;
  const googleId = payload.sub;

  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error);
  }

  // Check if student exists
  const student = await prisma.student.findUnique({
    where: { email },
    include: {
      city: true,
      batch: true,
    },
  });

  if (!student) {
    throw new ApiError(422, "Student not registered by admin", [], "STUDENT_NOT_REGISTERED");
  }

  // Update google_id if not set
  if (!student.google_id) {
    await prisma.student.update({
      where: { id: student.id },
      data: { google_id: googleId },
    });
  }

  const accessToken = generateAccessToken({
    id: student.id,
    email: student.email,
    role: "STUDENT",
    userType: "student",
    ...(student.batch && student.city && {
      batchId: student.batch.id,
      batchName: student.batch.batch_name,
      batchSlug: student.batch.slug,
      cityId: student.city.id,
      cityName: student.city.city_name,
    }),
  });

  const refreshToken = generateRefreshToken({
    id: student.id,
    userType: "student",
  });

  // Update refresh token in database
  await prisma.student.update({
    where: { id: student.id },
    data: { refresh_token: refreshToken },
  });

  return {
    user: {
      id: student.id,
      name: student.name,
      email: student.email,
      username: student.username,
      city: student.city,
      batch: student.batch,
      leetcode_id: student.leetcode_id,
      gfg_id: student.gfg_id,
      cityId: student.city_id,
      cityName: student.city?.city_name || null,
      batchId: student.batch_id,
      batchName: student.batch?.batch_name || null,
      batchSlug: student.batch?.slug || null
    },
    accessToken,
    refreshToken
  };
};

export const logoutStudent = async (studentId: number) => {
  if (studentId) {
    await prisma.student.update({
      where: { id: studentId },
      data: { refresh_token: null }
    });
  }
};

export const logoutAdmin = async (adminId: number) => {
  if (adminId) {
    await prisma.admin.update({
      where: { id: adminId },
      data: { refresh_token: null }
    });
  }
};

export const sendPasswordResetOTP = async (email: string) => {
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error);
  }

  // Check if user exists (student or admin)
  let user = null;
  user = await prisma.student.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.admin.findUnique({ where: { email } });
  }

  if (!user) {
    throw new ApiError(404, 'No account found with this email address');
  }

  // Generate and save OTP
  const otp = generateOTP();
  console.log(`Generated OTP for ${email}: ${otp}`);
  await saveOTP(email, otp);
  console.log('OTP saved to database');

  // Send OTP email
  console.log('Attempting to send OTP email...');
  await sendOTPEmail(email, otp, user?.name);
  console.log('OTP email sent successfully!');

  return {
    message: 'OTP sent to your email address',
    otp // Return OTP for testing
  };
};

export const verifyOTP = async (email: string, otp: string) => {
  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error);
  }

  // Verify OTP
  console.log(`Attempting to validate OTP: ${otp} for email: ${email}`);
  const isValidOTP = await validateOTP(email, otp);
  console.log(`OTP validation result: ${isValidOTP}`);

  if (!isValidOTP) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  return {
    message: 'OTP verified successfully',
    valid: true
  };
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, 'Email, OTP, and new password are required');
  }

  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error);
  }

  // Validate password strength
  validatePasswordForAuth(newPassword);

  // Verify OTP
  console.log(`Attempting to validate OTP: ${otp} for email: ${email}`);
  const isValidOTP = await validateOTP(email, otp);
  console.log(`OTP validation result: ${isValidOTP}`);

  if (!isValidOTP) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  // Mark OTP as used
  await prisma.passwordResetOTP.updateMany({
    where: {
      email,
      is_used: false
    },
    data: { is_used: true }
  });

  // Find user
  let user = null;
  user = await prisma.student.findUnique({ where: { email } });

  let userType = '';
  if (user) {
    userType = 'student';
  } else {
    user = await prisma.admin.findUnique({ where: { email } });
    if (user) {
      userType = 'admin';
    }
  }

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if new password is same as current password
  if (user.password_hash) {
    const isSamePassword = await comparePassword(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new ApiError(400, 'New password cannot be the same as your current password');
    }
  }

  // Hash new password
  const password_hash = await hashPassword(newPassword);

  // Update password based on user type
  if (userType === 'student') {
    await prisma.student.update({
      where: { email },
      data: { password_hash }
    });
  } else {
    await prisma.admin.update({
      where: { email },
      data: { password_hash }
    });
  }

  return {
    message: 'Password reset successful. You can now login with your new password.'
  };
};