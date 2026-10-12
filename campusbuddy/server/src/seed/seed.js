// Usage: npm run seed   (wipes buildings, courses, events, announcements, tasks and chat, then re-seeds)
import mongoose from 'mongoose';
import { config } from '../config.js';
import { runSeed } from './runSeed.js';
import { demoUser } from './data.js';

try {
  await mongoose.connect(config.mongoUri);
  await runSeed({ reset: true });
  console.log('Seeded sample campus data.');
  console.log(`Demo login: ${demoUser.email} / ${demoUser.password}`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
