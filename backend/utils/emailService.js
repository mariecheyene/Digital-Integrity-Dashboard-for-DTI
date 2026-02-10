const nodemailer = require('nodemailer');
require('dotenv').config();

// Validate email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️  WARNING: Email credentials not configured in .env file');
  console.warn('   EMAIL_USER and EMAIL_PASSWORD are required for OTP emails');
}

// Create reusable transporter (EXACTLY like your other system)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.error('   Please check your EMAIL_USER and EMAIL_PASSWORD in .env file');
    if (error.message.includes('Application-specific password')) {
      console.error('   ⚠️  You need to use a Gmail App Password, not your regular password!');
      console.error('   📖 Follow the guide: https://support.google.com/accounts/answer/185833');
    }
  } else {
    console.log('✅ Email service is ready to send OTP emails');
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Welcome OTP Email
const sendWelcomeOTP = async (email, userName, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Digital Integrity Dashboard - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Welcome to Digital Integrity Dashboard</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Your account has been created. Please use the following OTP to complete your first-time login:</p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #1a237e; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <h1 style="color: #1a237e; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">This OTP will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">If you didn't request this, please contact your administrator immediately.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Digital Integrity Dashboard - DTI Lanao Del Norte Province
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome OTP email sent successfully to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset OTP Email
const sendPasswordResetOTP = async (email, userName, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Digital Integrity Dashboard - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Please use the following OTP to complete the password reset process:</p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #dc3545; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <h1 style="color: #dc3545; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">This OTP will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #dc3545; font-size: 14px; line-height: 1.6;"><strong>⚠️ If you didn't request this password reset, please ignore this email and contact your administrator immediately.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Digital Integrity Dashboard - DTI Lanao Del Norte Province
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset OTP email sent successfully to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset Success Email
const sendPasswordResetSuccess = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Digital Integrity Dashboard - Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset Successful</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Your password has been successfully reset.</p>
            
            <div style="background-color: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <h1 style="color: #4caf50; font-size: 24px; margin: 0;">✅ Password Reset Successful!</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">You can now login to your account using your new password.</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">If you did not make this change, please contact your administrator immediately.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Digital Integrity Dashboard - DTI Lanao Del Norte Province
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset success email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset success email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  transporter,
  generateOTP,
  sendWelcomeOTP,
  sendPasswordResetOTP,
  sendPasswordResetSuccess
};