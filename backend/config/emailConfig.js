const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Email templates
const emailTemplates = {
  welcomeUser: (name, email, password, loginUrl) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a237e, #3949ab); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00bcd4; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #1a237e, #3949ab); 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 10px 0; 
      font-weight: bold; 
    }
    .warning { background: #fff3e0; padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ff9800; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Digital Integrity Dashboard</h2>
      <p>Department of Trade and Industry - Lanao Del Norte Province</p>
    </div>
    
    <div class="content">
      <h3>Welcome, ${name}!</h3>
      <p>Your account has been successfully created for the <strong>Digital Integrity Dashboard</strong> system.</p>
      
      <div class="credentials">
        <h4>Your Login Credentials:</h4>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Login URL:</strong> ${loginUrl}</p>
      </div>
      
      <div class="warning">
        <p><strong>Important:</strong> Please change your password after your first login.</p>
      </div>
      
      <a href="${loginUrl}" class="button">Login to Dashboard</a>
      
      <p>If you have any questions, please contact the system administrator.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} DTI - Lanao Del Norte Province</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `,
  
  passwordReset: (name, resetCode, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a237e, #3949ab); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .code-box { 
      background: white; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0; 
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #1a237e;
      border: 2px dashed #00bcd4;
    }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #1a237e, #3949ab); 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 10px 0; 
      font-weight: bold; 
    }
    .note { background: #e8f5e9; padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #4caf50; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Password Reset Request</h2>
      <p>Digital Integrity Dashboard - DTI Lanao Del Norte</p>
    </div>
    
    <div class="content">
      <h3>Hello, ${name}!</h3>
      <p>You have requested to reset your password for the Digital Integrity Dashboard.</p>
      
      <div class="code-box">
        ${resetCode}
      </div>
      
      <p>Enter this verification code on the password reset page. This code will expire in 10 minutes.</p>
      
      <div class="note">
        <p><strong>Note:</strong> If you did not request a password reset, please ignore this email or contact the system administrator.</p>
      </div>
      
      <p>Or click the button below to reset your password:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} DTI - Lanao Del Norte Province</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `,
  
  passwordResetSuccess: (name) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a237e, #3949ab); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { 
      background: #e8f5e9; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0; 
      text-align: center;
      border-left: 4px solid #4caf50;
    }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Password Reset Successful</h2>
      <p>Digital Integrity Dashboard - DTI Lanao Del Norte</p>
    </div>
    
    <div class="content">
      <h3>Hello, ${name}!</h3>
      
      <div class="success-box">
        <h4>✅ Your password has been successfully reset!</h4>
      </div>
      
      <p>Your account password has been updated. You can now login with your new password.</p>
      
      <p>If you did not make this change, please contact the system administrator immediately.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} DTI - Lanao Del Norte Province</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `
};

module.exports = {
  transporter,
  emailTemplates
};