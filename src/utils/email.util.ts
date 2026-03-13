import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, userName?: string): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 DSA Tracker - Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html style="margin: 0; padding: 0; background-color: #f5f7fa;">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>DSA Tracker - Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 0; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🚀 DSA Tracker
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                Secure Password Reset Portal
              </p>
            </div>
          </div>

          <!-- Main Content -->
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden;">
            
            <!-- User Greeting -->
            <div style="padding: 40px 40px 20px 40px; background-color: #fafbfc; border-bottom: 1px solid #e8eef2;">
              <h2 style="color: #2d3748; margin: 0; font-size: 24px; font-weight: 600;">
                ${userName ? `Hi ${userName},` : 'Hello,'}
              </h2>
              <p style="color: #718096; margin: 8px 0 0 0; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your DSA Tracker account.
              </p>
            </div>

            <!-- OTP Section -->
            <div style="padding: 40px; text-align: center;">
              <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; font-weight: 500;">
                Use the One-Time Password (OTP) below to reset your password:
              </p>
              
              <!-- OTP Display -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 36px; font-weight: 700; 
                          padding: 25px 40px; border-radius: 12px; letter-spacing: 8px; 
                          display: inline-block; margin: 20px 0; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                          text-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid rgba(255,255,255,0.1);">
                ${otp}
              </div>

              <!-- Expiry Notice -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px;">
                <span style="background-color: #fed7d7; color: #c53030; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                  ⏰ Expires in 10 minutes
                </span>
              </div>
            </div>

            <!-- Instructions -->
            <div style="padding: 20px 40px 40px 40px; background-color: #f8fafc;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                📋 Instructions:
              </h3>
              <ol style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li style="margin-bottom: 10px;">Enter the OTP in the password reset form</li>
                <li style="margin-bottom: 10px;">Create a new password (minimum 6 characters)</li>
                <li style="margin-bottom: 10px;">Use your new password to login to your account</li>
              </ol>
            </div>

            <!-- Security Notice -->
            <div style="padding: 30px 40px; background-color: #fef5e7; border-left: 4px solid #f6ad55;">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="color: #d69e2e; font-size: 20px; margin-top: 2px;">🔒</span>
                <div>
                  <h4 style="color: #92400e; margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">
                    Security Notice
                  </h4>
                  <p style="color: #975a16; margin: 0; font-size: 14px; line-height: 1.5;">
                    Never share this OTP with anyone. Our team will never ask for your OTP via email, phone, or any other method.
                  </p>
                </div>
              </div>
            </div>

            <!-- Help Section -->
            <div style="padding: 30px 40px 40px 40px; background-color: #f0f4f8; border-top: 1px solid #e2e8f0;">
              <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                ❓ Need Help?
              </h3>
              <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.5;">
                If you didn't request this password reset, please ignore this email or contact our support team.
              </p>
              <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" 
                   style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; 
                          border-radius: 8px; font-weight: 600; display: inline-block;">
                  Contact Support
                </a>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #2d3748; padding: 30px 0; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto;">
              <p style="color: #a0aec0; margin: 0 0 10px 0; font-size: 14px;">
                © 2024 DSA Tracker. All rights reserved.
              </p>
              <div style="display: flex; justify-content: center; gap: 20px;">
                <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 14px;">Privacy</a>
                <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 14px;">Terms</a>
                <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 14px;">Support</a>
              </div>
            </div>
          </div>

        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send welcome email (optional)
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
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
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email failure
  }
};
