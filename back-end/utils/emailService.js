const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, fullName = '', subject = '') => {
  // Always log OTP to console for development/testing
  console.log(`🔐 DEVELOPMENT MODE - OTP for ${email}: ${otp}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔢 OTP Code: ${otp}`);
  console.log(`👤 Name: ${fullName || 'N/A'}`);
  console.log(`📋 Subject: ${subject || 'Login Verification'}`);
  console.log('=' .repeat(50));

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SMAART Minds" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject || 'Your Login Verification Code - SMAART Minds',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #002147 0%, #30919D 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SMAART Minds</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Login Verification</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 20px 0;">
              Hello${fullName ? ` ${fullName}` : ''},
            </p>
            
            <p style="color: #334155; font-size: 16px; margin: 0 0 20px 0;">
              Please use the following verification code to complete your login:
            </p>
            
            <div style="background: #002147; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 12px; text-align: center; margin: 25px 0;">
              ${otp}
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
              This code will expire in <strong>5 minutes</strong>.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin: 15px 0 0 0;">
              If you didn't request this code, please ignore this email or contact support if you have concerns.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
              © ${new Date().getFullYear()} SMAART Minds. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send generic email for alerts/notifications
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"SMAART Minds" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    };
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully:', { messageId: info.messageId, to });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendEmail,
};
