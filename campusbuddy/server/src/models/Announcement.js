import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    pinned: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now, index: true },
    readBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
