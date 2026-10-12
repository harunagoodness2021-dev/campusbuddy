import { Router } from 'express';
import { Event } from '../models/Event.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const events = await Event.find({ $or: [{ startsAt: { $gte: now } }, { endsAt: { $gte: now } }] })
      .sort({ startsAt: 1 })
      .populate('building', 'name lat lng')
      .lean();
    res.json({ events });
  })
);

export default router;
