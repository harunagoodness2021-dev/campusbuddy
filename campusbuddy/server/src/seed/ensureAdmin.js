import { config } from '../config.js';
import { User } from '../models/User.js';

/**
 * Makes sure at least one admin exists. Runs on every start but does nothing once an admin exists.
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD in server/.env.
 * In development, if ADMIN_PASSWORD is empty, a default password is used and printed in the terminal.
 * In production an explicit ADMIN_PASSWORD is required (no default is ever created).
 * Returns { email, password } when an account was created or promoted, otherwise null.
 */
export async function ensureAdmin() {
  if (await User.exists({ role: 'admin' })) return null;

  const usingDefault = !config.adminPassword;
  if (usingDefault && config.isProd) {
    console.warn('No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
    return null;
  }
  const password = config.adminPassword || 'admin12345';
  const shown = usingDefault ? password : '(the ADMIN_PASSWORD from your .env)';

  const existing = await User.findOne({ email: config.adminEmail });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    return { email: config.adminEmail, password: '(your existing password)' };
  }

  await User.create({ name: 'Campus Admin', email: config.adminEmail, password, role: 'admin' });
  return { email: config.adminEmail, password: shown };
}
