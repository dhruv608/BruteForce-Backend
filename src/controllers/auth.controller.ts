import { Request, Response } from 'express';

import { asyncHandler } from "../utils/asyncHandler";

import * as authService from '../services/auth.service';

// Student Registration

export const registerStudent = asyncHandler(async (req: Request, res: Response) => {

  const student = await authService.registerStudent(req.body);



  res.status(201).json({

    message: 'Student registered successfully',

    user: student,

  });

});



// Student Login

export const loginStudent = asyncHandler(async (req: Request, res: Response) => {

  const { user, accessToken, refreshToken } = await authService.loginStudent(req.body);

  

  // Set refresh token cookie

  res.cookie('refreshToken', refreshToken, {

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'strict',

    maxAge: 7 * 24 * 60 * 60 * 1000,

    path: '/'

  });

 

  res.json({

    message: 'Login successful',

    accessToken,

    user,

  });

});



// Admin/Teacher Registration

export const registerAdmin = asyncHandler(async (req: Request, res: Response) => {

  const { user, accessToken, refreshToken } = await authService.registerAdmin({

    ...req.body,

    currentUserRole: req.user?.role

  });

 

  res.status(201).json({

    message: 'Admin registered successfully',

    accessToken,

    user,

  });

});



// Admin Login

export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {

  const { user, accessToken, refreshToken } = await authService.loginAdmin(req.body);

  

  // Set refresh token cookie

  res.cookie('refreshToken', refreshToken, {

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'strict',

    maxAge: 7 * 24 * 60 * 60 * 1000,

    path: '/'

  });



  res.json({

    message: 'Login successful',

    accessToken,

    user,

  });

});



export const refreshToken = asyncHandler(async (req: Request, res: Response) => {

  const refreshToken = req.cookies.refreshToken;

  const { accessToken } = await authService.refreshAccessToken(refreshToken);

  

  res.json({ accessToken });

});



export const googleLogin = asyncHandler(async (req: Request, res: Response) => {

  const { idToken } = req.body;

  const { user, accessToken, refreshToken } = await authService.googleAuth(idToken);

  

  // Set refresh token cookie

  res.cookie('refreshToken', refreshToken, {

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'strict',

    maxAge: 7 * 24 * 60 * 60 * 1000,

    path: '/'

  });



  res.json({

    message: "Google login successful",

    accessToken,

    user,

  });

});



// Student Logout

export const logoutStudent = asyncHandler(async (req: Request, res: Response) => {

  const studentId = (req as any).student?.id;

  await authService.logoutStudent(studentId);

  

  // Clear refresh token cookie

  res.clearCookie('refreshToken');



  res.json({

    message: "Student logout successful",

  });

});



// Admin Logout

export const logoutAdmin = asyncHandler(async (req: Request, res: Response) => {

  const adminId = (req as any).admin?.id;

  await authService.logoutAdmin(adminId);

  

  // Clear refresh token cookie

  res.clearCookie('refreshToken');



  res.json({

    message: "Admin logout successful",

  });

});



// Forgot Password - Send OTP

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {

  const { email } = req.body;

  const result = await authService.sendPasswordResetOTP(email);

  

  res.json(result);

});



// Verify OTP - Only validate OTP, don't reset password

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {

  const { email, otp } = req.body;

  const result = await authService.verifyOTP(email, otp);

  

  res.json(result);

});



// Reset Password - Verify OTP and reset password

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {

  const { email, otp, newPassword } = req.body;

  const result = await authService.resetPassword(email, otp, newPassword);

  

  res.json(result);

});

