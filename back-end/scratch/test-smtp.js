const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

async function testEmail() {
  console.log('Testing SMTP with:', process.env.SMTP_USER);
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.SMTP_USER}>`,
      to: 'vickram4656@gmail.com',
      subject: 'SMTP Test',
      text: 'If you see this, SMTP is working!',
    });
    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
}

testEmail();
