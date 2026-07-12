import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  console.log('✅ Nodemailer SMTP transporter initialized.');
} else {
  console.warn(
    '⚠️ SMTP environment variables are missing. Mailer will fall back to logging emails to the console.'
  );
}

/**
 * Sends an email or logs to console if SMTP is not configured.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 */
export async function sendEmail({ to, subject, text, html }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        text,
        html,
      });
      console.log(`✉️ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  } else {
    // Fallback console logging in development/test
    console.log('\n=================== MOCK EMAIL SENT ===================');
    console.log(`TO:      ${to}`);
    console.log(`FROM:    ${env.SMTP_FROM}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT:`);
    console.log(text);
    console.log('=======================================================\n');
    return { mock: true, text };
  }
}
