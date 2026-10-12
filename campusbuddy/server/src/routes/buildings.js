import { Router } from 'express';
import mongoose from 'mongoose';
import { Building, BUILDING_CATEGORIES } from '../models/Building.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/buildings?q=library&category=faculty   (public: the landing page shows the map too)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';

    if (category && category !== 'all') {
      if (!BUILDING_CATEGORIES.includes(category)) throw new HttpError(400, 'Unknown category');
      filter.category = category;
    }
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { aliases: rx }, { description: rx }, { category: rx }];
    }

    const buildings = await Building.find(filter).sort({ name: 1 }).lean();
    res.json({ buildings });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Building not found');
    const building = await Building.findById(req.params.id).lean();
    if (!building) throw new HttpError(404, 'Building not found');
    res.json({ building });
  })
);

export default router;
