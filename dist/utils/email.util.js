"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create email transporter
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};
// Send OTP email
const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'DSA Tracker - Password Reset OTP',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">DSA Tracker Password Reset</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; font-size: 16px;">You requested to reset your password. Use the OTP below:</p>
            <div style="background-color: #007bff; color: white; font-size: 24px; font-weight: bold; 
                        padding: 15px; text-align: center; border-radius: 6px; letter-spacing: 3px;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              This OTP will expire in <strong>10 minutes</strong>.
            </p>
          </div>
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      `
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};
exports.sendOTPEmail = sendOTPEmail;
// Send welcome email (optional)
const sendWelcomeEmail = async (email, name) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to DSA Tracker',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Welcome to DSA Tracker!</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; font-size: 16px;">Hi ${name},</p>
            <p style="color: #666; font-size: 16px;">
              Welcome to the DSA Tracker platform! Your account has been successfully created.
            </p>
            <p style="color: #666; font-size: 16px;">
              You can now login using your @pwioi.com email address and password.
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: bold; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Best regards,<br>
            DSA Tracker Team
          </p>
        </div>
      `
        };
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw error for welcome email failure
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
