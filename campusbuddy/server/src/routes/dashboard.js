import { Router } from 'express';
import { Course } from '../models/Course.js';
import { Task } from '../models/Task.js';
import { Announcement } from '../models/Announcement.js';
import { Event } from '../models/Event.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { campusNow } from '../utils/time.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();
    const upcoming = { $or: [{ startsAt: { $gte: now } }, { endsAt: { $gte: now } }] };

    const [todaysClasses, pendingTasks, unreadNotices, upcomingEventCount, announcements, events] =
      await Promise.all([
        Course.find({ day: campusNow(now).day })
          .populate('building', 'name lat lng')
          .sort({ startTime: 1 })
          .lean(),
        Task.countDocuments({ user: userId, done: false }),
        Announcement.countDocuments({ readBy: { $ne: userId } }),
        Event.countDocuments(upcoming),
        Announcement.find().sort({ publishedAt: -1 }).limit(5).lean(),
        Event.find(upcoming).sort({ startsAt: 1 }).limit(5).populate('building', 'name lat lng').lean(),
      ]);

    res.json({
      stats: {
        todaysClasses: todaysClasses.length,
        pendingTasks,
        unreadNotices,
        upcomingEvents: upcomingEventCount,
      },
      todaysClasses,
      announcements: announcements.map(({ readBy, ...a }) => ({
        ...a,
        read: readBy.some((id) => id.equals(userId)),
      })),
      events,
    });
  })
);

export default router;
