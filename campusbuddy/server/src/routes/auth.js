import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { rateLimit } from '../utils/rateLimit.js';
import { sendMail } from '../services/mailer.js';
import { createResetLink, hashToken } from '../services/passwordReset.js';

const router = Router();

const str = (v) => (typeof v === 'string' ? v.trim() : '');

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = str(req.body.name);
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Please enter a valid email address');
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists');

    const user = await User.create({
      name,
      email,
      password,
      department: str(req.body.department),
      level: str(req.body.level),
    });
    res.status(201).json({ token: signToken(user), user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.verifyPassword(password))) {
      throw new HttpError(401, 'Incorrect email or password');
    }
    res.json({ token: signToken(user), user });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, department, level } = req.body;
    if (typeof name === 'string' && name.trim()) req.user.name = name.trim();
    if (typeof department === 'string') req.user.department = department.trim();
    if (typeof level === 'string') req.user.level = level.trim();
    await req.user.save();
    res.json({ user: req.user });
  })
);

const forgotLimiter = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 });
const resetLimiter = rateLimit({ max: 10, windowMs: 15 * 60 * 1000 });

/** Always answers the same way, so nobody can use this to find out which emails have accounts. */
router.post(
  '/forgot-password',
  forgotLimiter,
  asyncHandler(async (req, res) => {
    const email = str(req.body.email).toLowerCase();
    const user = email ? await User.findOne({ email }) : null;
    if (user) {
      const link = await createResetLink(user);
      await sendMail({
        to: user.email,
        subject: 'Reset your CampusBuddy password',
        text: `Hi ${user.name},\n\nUse this link to choose a new password (it works for 30 minutes):\n${link}\n\nIf you did not ask for this, you can ignore this email - your password has not changed.`,
      });
    }
    res.json({ message: 'If that email has an account, a reset link has been sent.' });
  })
);

router.post(
  '/reset-password',
  resetLimiter,
  asyncHandler(async (req, res) => {
    const token = str(req.body.token);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

    const user = token
      ? await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } }).select(
          '+resetTokenHash +resetTokenExpires'
        )
      : null;
    if (!user) throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');

    user.password = password;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ token: signToken(user), user });
  })
);

router.post(
  '/change-password',
  requireAuth,
  resetLimiter,
  asyncHandler(async (req, res) => {
    const current = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const next = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    if (next.length < 6) throw new HttpError(400, 'New password must be at least 6 characters');

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.verifyPassword(current))) throw new HttpError(400, 'Your current password is not correct');

    user.password = next;
    await user.save();
    res.json({ token: signToken(user), user });
  })
);

export default router;
