import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import { HttpError } from './utils/asyncHandler.js';
import { aiMode } from './services/ai.js';
import { runSeed } from './seed/runSeed.js';
import { ensureAdmin } from './seed/ensureAdmin.js';
import adminRoutes from './routes/admin.js';

if (config.dnsServers.length) dns.setServers(config.dnsServers);

import authRoutes from './routes/auth.js';
import buildingRoutes from './routes/buildings.js';
import dashboardRoutes from './routes/dashboard.js';
import announcementRoutes from './routes/announcements.js';
import eventRoutes from './routes/events.js';
import courseRoutes from './routes/courses.js';
import taskRoutes from './routes/tasks.js';
import chatRoutes from './routes/chat.js';

const app = express();

app.use(cors({ origin: config.clientOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: aiMode(), db: mongoose.connection.readyState === 1 });
});

app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid value';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That record already exists';
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    message = 'Invalid JSON';
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong';
  }
  res.status(status).json({ error: message });
});

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');

    if (config.autoSeed && (await runSeed())) {
      console.log('Database was empty - sample campus data added (login: johnson@nsuk.edu.ng / campus123)');
    }

    const admin = await ensureAdmin();
    if (admin) {
      console.log(`Admin account created - login: ${admin.email} / ${admin.password}`);
      console.log('Change this password: set ADMIN_PASSWORD in server/.env before the first start next time.');
    }

    app.listen(config.port, () => {
      console.log(`API listening on http://localhost:${config.port}  (AI mode: ${aiMode()})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
