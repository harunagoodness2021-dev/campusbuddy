import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date },
    venue: { type: String, default: '' },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
    category: { type: String, default: 'general' },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
