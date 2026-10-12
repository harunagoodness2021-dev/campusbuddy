import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { Building, BUILDING_CATEGORIES } from '../models/Building.js';
import { Announcement } from '../models/Announcement.js';
import { Event } from '../models/Event.js';
import { Course } from '../models/Course.js';
import { Task } from '../models/Task.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { createResetLink } from '../services/passwordReset.js';

const router = Router();
router.use(requireAuth, requireAdmin); // every route in this file is admin-only

const isEmpty = (v) => v === '' || v === null || v === undefined;

/**
 * Copies only the whitelisted fields from the request body and tidies their types,
 * so an admin can never set fields like _id, password or readBy through these routes.
 */
export function pickFields(Model, body, allowed) {
  const out = {};
  for (const name of allowed) {
    if (!(name in body)) continue;
    let value = body[name];
    const kind = Model.schema.path(name)?.instance;

    if (kind === 'Array') {
      const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
      value = list.map((v) => String(v).trim()).filter(Boolean);
    } else if ((kind === 'Number' || kind === 'Date' || kind === 'ObjectId') && isEmpty(value)) {
      value = undefined; // empty box = clear the value
    } else if (kind === 'String') {
      value = isEmpty(value) ? '' : String(value).trim();
    }
    out[name] = value;
  }
  return out;
}

async function findOr404(Model, id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Not found');
  const doc = await Model.findById(id);
  if (!doc) throw new HttpError(404, 'Not found');
  return doc;
}

/** Mounts list / create / update / delete routes for one model at /api/admin/<path>. */
function crud(path, Model, { fields, sort, populate, afterDelete }) {
  const r = Router();
  const withPopulate = (query) => (populate ? query.populate(populate) : query);

  r.get(
    '/',
    asyncHandler(async (_req, res) => {
      const items = await withPopulate(Model.find().sort(sort).limit(500)).lean();
      res.json({ items });
    })
  );

  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const doc = await Model.create(pickFields(Model, req.body, fields));
      const item = await withPopulate(Model.findById(doc._id)).lean();
      res.status(201).json({ item });
    })
  );

  r.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await findOr404(Model, req.params.id);
      doc.set(pickFields(Model, req.body, fields));
      await doc.save();
      const item = await withPopulate(Model.findById(doc._id)).lean();
      res.json({ item });
    })
  );

  r.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await findOr404(Model, req.params.id);
      await doc.deleteOne();
      if (afterDelete) await afterDelete(doc);
      res.json({ ok: true });
    })
  );

  router.use(`/${path}`, r);
}

crud('buildings', Building, {
  fields: ['name', 'category', 'description', 'lat', 'lng', 'phone', 'email', 'image', 'hours', 'facilities', 'aliases'],
  sort: { name: 1 },
  // Courses and events that pointed at a deleted building just lose the link
  afterDelete: async (doc) => {
    await Promise.all([
      Course.updateMany({ building: doc._id }, { $unset: { building: 1 } }),
      Event.updateMany({ building: doc._id }, { $unset: { building: 1 } }),
    ]);
  },
});

crud('announcements', Announcement, {
  fields: ['title', 'body', 'pinned', 'publishedAt'],
  sort: { publishedAt: -1 },
});

crud('events', Event, {
  fields: ['title', 'description', 'startsAt', 'endsAt', 'venue', 'building', 'category'],
  sort: { startsAt: -1 },
  populate: { path: 'building', select: 'name' },
});

crud('courses', Course, {
  fields: ['code', 'title', 'lecturer', 'credits', 'day', 'startTime', 'endTime', 'room', 'building'],
  sort: { day: 1, startTime: 1 },
  populate: { path: 'building', select: 'name' },
});

/* ------------------------------ users ------------------------------ */

const ROLES = ['student', 'staff', 'admin'];

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const items = await User.find().sort({ createdAt: -1 }).limit(500).lean(); // password is never selected
    res.json({ items: items.map(({ __v, ...u }) => u) });
  })
);

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await findOr404(User, req.params.id);
    if (user.id === req.user.id) throw new HttpError(400, 'You cannot change your own role');
    if (!ROLES.includes(req.body.role)) throw new HttpError(400, 'Role must be student, staff or admin');
    user.role = req.body.role;
    await user.save();
    res.json({ item: user });
  })
);

// Makes a one-time link the admin can send to a student who cannot get the email
router.post(
  '/users/:id/reset-link',
  asyncHandler(async (req, res) => {
    const user = await findOr404(User, req.params.id);
    res.json({ link: await createResetLink(user), expiresInMinutes: 30 });
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await findOr404(User, req.params.id);
    if (user.id === req.user.id) throw new HttpError(400, 'You cannot delete your own account');
    await Promise.all([
      Task.deleteMany({ user: user._id }),
      ChatMessage.deleteMany({ user: user._id }),
      user.deleteOne(),
    ]);
    res.json({ ok: true });
  })
);

/* ------------------------------ overview ------------------------------ */

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [users, admins, buildings, courses, events, announcements, chatMessages] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Building.countDocuments(),
      Course.countDocuments(),
      Event.countDocuments(),
      Announcement.countDocuments(),
      ChatMessage.countDocuments(),
    ]);
    res.json({ stats: { users, admins, buildings, courses, events, announcements, chatMessages } });
  })
);

export { BUILDING_CATEGORIES };
export default router;
