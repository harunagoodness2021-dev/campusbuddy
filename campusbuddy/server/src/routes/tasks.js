import { Router } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

const parseDate = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, 'Invalid due date');
  return d;
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tasks = await Task.find({ user: req.user._id }).sort({ done: 1, dueDate: 1, createdAt: -1 }).lean();
    res.json({ tasks });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) throw new HttpError(400, 'Task title is required');
    const task = await Task.create({ user: req.user._id, title, dueDate: parseDate(req.body.dueDate) });
    res.status(201).json({ task });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Task not found');
    const update = {};
    if (typeof req.body.done === 'boolean') update.done = req.body.done;
    if (typeof req.body.title === 'string' && req.body.title.trim()) update.title = req.body.title.trim();
    if ('dueDate' in req.body) update.dueDate = parseDate(req.body.dueDate) ?? null;

    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, update, { new: true });
    if (!task) throw new HttpError(404, 'Task not found');
    res.json({ task });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Task not found');
    const result = await Task.deleteOne({ _id: req.params.id, user: req.user._id });
    if (!result.deletedCount) throw new HttpError(404, 'Task not found');
    res.json({ ok: true });
  })
);

export default router;
