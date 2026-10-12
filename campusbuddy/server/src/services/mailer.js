import { config } from '../config.js';

let transporter; // undefined = not tried yet, null = email not available

async function getTransporter() {
  if (transporter !== undefined) return transporter;
  transporter = null;
  const { host, user, pass, port } = config.smtp;
  if (!host || !user || !pass) return null;
  try {
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  } catch {
    console.warn('Email is configured but the "nodemailer" package is missing. Run: npm install (inside the server folder)');
  }
  return transporter;
}

/**
 * Sends an email. Returns true if it was sent.
 * When email is not set up (or fails), the message is printed in the server terminal instead and false is returned.
 */
export async function sendMail({ to, subject, text }) {
  const t = await getTransporter();
  if (t) {
    try {
      await t.sendMail({ from: config.smtp.from || config.smtp.user, to, subject, text });
      return true;
    } catch (err) {
      console.error('Could not send email:', err.message);
    }
  }
  console.log(`\n--- Email (not sent, printed here) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n--------------------------------------\n`);
  return false;
}
