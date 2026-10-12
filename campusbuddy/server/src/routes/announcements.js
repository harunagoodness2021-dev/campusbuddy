import { Router } from 'express';
import mongoose from 'mongoose';
import { Announcement } from '../models/Announcement.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await Announcement.find().sort({ pinned: -1, publishedAt: -1 }).limit(50).lean();
    res.json({
      announcements: items.map(({ readBy, ...a }) => ({
        ...a,
        read: readBy.some((id) => id.equals(req.user._id)),
      })),
    });
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Announcement.updateMany({}, { $addToSet: { readBy: req.user._id } });
    res.json({ ok: true });
  })
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Announcement not found');
    const result = await Announcement.updateOne({ _id: req.params.id }, { $addToSet: { readBy: req.user._id } });
    if (!result.matchedCount) throw new HttpError(404, 'Announcement not found');
    res.json({ ok: true });
  })
);

export default router;
