import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    places: { type: [mongoose.Schema.Types.ObjectId], ref: 'Building', default: [] },
    source: { type: String, enum: ['openai', 'offline', 'user'], default: 'user' },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
