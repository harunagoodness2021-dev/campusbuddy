import crypto from 'node:crypto';
import { config } from '../config.js';
import { User } from '../models/User.js';

const TTL_MS = 30 * 60 * 1000; // links work for 30 minutes
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Creates a one-time reset link for a user. Only the hash of the token is saved in the database. */
export async function createResetLink(user) {
  const token = crypto.randomBytes(32).toString('hex');
  await User.updateOne(
    { _id: user._id },
    { resetTokenHash: hashToken(token), resetTokenExpires: new Date(Date.now() + TTL_MS) }
  );
  return `${config.clientUrl}/reset-password?token=${token}`;
}
