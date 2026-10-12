import { Router } from 'express';
import { ChatMessage } from '../models/ChatMessage.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { askCampusAI } from '../services/ai.js';

const router = Router();
router.use(requireAuth);

// Very small in-memory limiter: 20 questions per minute per user (protects your OpenAI bill).
const hits = new Map();
function chatLimiter(req, _res, next) {
  const now = Date.now();
  const recent = (hits.get(req.user.id) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 20) return next(new HttpError(429, 'You are sending messages too fast. Please wait a moment.'));
  recent.push(now);
  hits.set(req.user.id, recent);
  next();
}

const serialize = (m, places = m.places) => ({
  id: m._id,
  role: m.role,
  content: m.content,
  source: m.source,
  createdAt: m.createdAt,
  places: places || [],
});

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('places')
      .lean();
    res.json({ messages: messages.reverse().map((m) => serialize(m)) });
  })
);

router.post(
  '/',
  chatLimiter,
  asyncHandler(async (req, res) => {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) throw new HttpError(400, 'Please type a question');
    if (message.length > 1000) throw new HttpError(400, 'Message is too long (max 1000 characters)');

    const recent = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10).lean();
    const history = recent.reverse().map((m) => ({ role: m.role, content: m.content }));

    await ChatMessage.create({ user: req.user._id, role: 'user', content: message });

    const { reply, source, places } = await askCampusAI({ user: req.user, message, history });

    const saved = await ChatMessage.create({
      user: req.user._id,
      role: 'assistant',
      content: reply,
      source,
      places: places.map((p) => p._id),
    });

    res.json({ message: serialize(saved.toObject(), places) });
  })
);

router.delete(
  '/history',
  asyncHandler(async (req, res) => {
    await ChatMessage.deleteMany({ user: req.user._id });
    res.json({ ok: true });
  })
);

export default router;
