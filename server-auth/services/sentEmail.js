import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (email, subject, content) => {
  try {
    const mailOptions = {
      from: `Storage App <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: content,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error(`Error sending OTP to ${email}:`, error);
    throw new Error('Failed to send OTP');
  }
};
