import mongoose from 'mongoose';

export const BUILDING_CATEGORIES = [
  'faculty',
  'library',
  'admin',
  'medical',
  'hostel',
  'sports',
  'food',
  'worship',
  'other',
];

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, enum: BUILDING_CATEGORIES, required: true, index: true },
    description: { type: String, default: '' },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    image: { type: String, default: '' },
    hours: { type: String, default: '' },
    facilities: { type: [String], default: [] },
    // Other names people use for this place, used by search and the chatbot ("library", "sick bay"...)
    aliases: { type: [String], default: [] },
  },
  { timestamps: true }
);

buildingSchema.index({ name: 'text', description: 'text', aliases: 'text' });

export const Building = mongoose.model('Building', buildingSchema);
