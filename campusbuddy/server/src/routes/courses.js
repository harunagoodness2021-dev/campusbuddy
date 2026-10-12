import { Router } from 'express';
import { Course } from '../models/Course.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const courses = await Course.find()
      .populate('building', 'name lat lng')
      .sort({ day: 1, startTime: 1 })
      .lean();
    res.json({ courses });
  })
);

export default router;
