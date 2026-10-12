import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbuddy',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Address of the website, used in password-reset links
  clientUrl: (process.env.CLIENT_URL || process.env.CLIENT_ORIGIN?.split(',')[0] || 'http://localhost:5173').trim().replace(/\/$/, ''),
  // Optional email settings. Without them, reset links are printed in the server terminal instead.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || '',
  },
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  autoSeed: String(process.env.AUTO_SEED ?? 'true') === 'true',
  timeZone: 'Africa/Lagos',
  // Some networks cannot resolve MongoDB Atlas addresses ("querySrv ECONNREFUSED"); these public DNS servers fix that.
  // Set DNS_SERVERS= (empty) in .env to turn it off.
  dnsServers: (process.env.DNS_SERVERS ?? '8.8.8.8,1.1.1.1')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // First-run admin account (created only when the database has no admin yet)
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@nsuk.edu.ng').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  isProd,
};
