import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: '7d' });

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please sign in to continue');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account not found');
  // Tokens issued before the last password change are no longer valid
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new HttpError(401, 'Your password was changed. Please sign in again');
  }
  req.user = user;
  next();
});

/** Use after requireAuth. The role is read from the database on every request, never from the token. */
export const requireAdmin = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new HttpError(403, 'Admin access required'));
