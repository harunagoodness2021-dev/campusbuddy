import { Building } from '../models/Building.js';
import { Course } from '../models/Course.js';
import { Event } from '../models/Event.js';
import { Announcement } from '../models/Announcement.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { buildings, courses, events, announcements, demoUser } from './data.js';

/**
 * Inserts the sample data. With { reset: true } the campus collections are wiped first.
 * Without reset it only seeds when there are no buildings yet.
 */
export async function runSeed({ reset = false } = {}) {
  if (!reset && (await Building.estimatedDocumentCount()) > 0) return false;

  if (reset) {
    await Promise.all([
      Building.deleteMany({}),
      Course.deleteMany({}),
      Event.deleteMany({}),
      Announcement.deleteMany({}),
      Task.deleteMany({}),
      ChatMessage.deleteMany({}),
    ]);
  }

  const savedBuildings = await Building.insertMany(buildings);
  const idByName = new Map(savedBuildings.map((b) => [b.name, b._id]));

  await Course.insertMany(courses.map((c) => ({ ...c, building: idByName.get(c.building) })));
  await Event.insertMany(events().map((e) => ({ ...e, building: idByName.get(e.building) })));
  await Announcement.insertMany(announcements());

  let user = await User.findOne({ email: demoUser.email });
  if (!user) user = await User.create(demoUser);

  await Task.deleteMany({ user: user._id });
  const inDays = (d) => new Date(Date.now() + d * 86400000);
  await Task.insertMany([
    { user: user._id, title: 'Submit CSC 401 software design assignment', dueDate: inDays(2), done: false },
    { user: user._id, title: 'Register 400-level courses', dueDate: inDays(-1), done: true },
  ]);

  return true;
}
