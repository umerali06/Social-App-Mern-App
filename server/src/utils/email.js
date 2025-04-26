// server/src/utils/email.js
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // ← let Nodemailer handle host/port/TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // your 16-char App Password
  },
});

transporter
  .verify()
  .then(() => console.log("✅ SMTP transporter ready"))
  .catch((err) => console.error("❌ SMTP connection error:", err));

module.exports = async function sendEmail({ to, subject, text }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`⚠️ Error sending email to ${to}:`, err);
    throw err;
  }
};
