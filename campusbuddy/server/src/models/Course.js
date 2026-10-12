import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    lecturer: { type: String, default: '' },
    credits: { type: Number, default: 3 },
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, required: true }, // "HH:mm" 24h
    endTime: { type: String, required: true },
    room: { type: String, default: '' },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);
