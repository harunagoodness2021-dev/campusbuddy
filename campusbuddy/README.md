# CampusBuddy

An AI campus assistant for Nasarawa State University, Keffi (NSUK), recreated from your demo video.

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router |
| Map | OpenStreetMap tiles via Leaflet / react-leaflet, satellite view from Esri, walking routes from OSRM |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| AI chat | OpenAI API (with an offline fallback that answers from the database) |

## Features

- **Landing page** with a live campus map preview and Sign in.
- **Auth**: register and log in (JWT, bcrypt).
- **Dashboard**: greeting, today's classes, pending tasks, unread notices, upcoming events, announcements (click to mark read).
- **AI Assistant**: chat with quick prompts. Answers are grounded in your MongoDB data (buildings, timetable, events, announcements). Replies that mention a building get a "Show on map" button. History is saved per user.
- **Map**: search, category chips (Faculty, Library, Admin, Medical, Hostel...), default and satellite views, zoom, locate me, building details (contact, hours, facilities), bookmark, share, and **Get Directions** (locates you, then draws a walking route with distance and time).
- **Schedule** (weekly timetable plus tasks), **Courses**, **Settings**, **Help & Support**.
- Responsive: sidebar becomes a drawer and building details become a bottom sheet on phones.

## Setup

You need Node 20+ and MongoDB (local, or a free MongoDB Atlas connection string).

```bash
# 1. install everything
npm run install:all

# 2. configure the server
cp server/.env.example server/.env
#    then edit server/.env: set MONGODB_URI, JWT_SECRET and (optionally) OPENAI_API_KEY

# 3. run (two terminals)
npm run server      # API on http://localhost:5000
npm run client      # app on http://localhost:5173
```

On first start the API fills an empty database with sample NSUK data (`AUTO_SEED=true`).
Demo login: **johnson@nsuk.edu.ng / campus123**. To reset the sample data at any time: `npm run seed`.

### OpenAI

Put your key in `server/.env` as `OPENAI_API_KEY` (model defaults to `gpt-4o-mini`, change with `OPENAI_MODEL`).
The key stays on the server and is never sent to the browser. Without a key, or if OpenAI is unreachable, the assistant
falls back to simple answers built from the database, so the app still works. `GET /api/health` shows which mode is active.

## Things to adjust

- **Real campus data.** The building coordinates, phone numbers, emails, lecturers and courses in
  `server/src/seed/data.js` are **sample values** (coordinates are approximate, around 8.847 N, 7.878 E). Correct them
  with the real ones, or edit the documents in MongoDB, then run `npm run seed`. Building images can be set with the `image` URL field.
- **Map tiles.** OpenStreetMap does not provide satellite imagery, so the Satellite option uses Esri World Imagery.
  The public OSM tile server and the public walking-route server (`routing.openstreetmap.de`) have fair-use limits:
  fine for a project demo, but for heavy production traffic use a tile provider (e.g. MapTiler) and your own OSRM
  (set `VITE_ROUTING_URL`).
- **Courses and timetable** are shared by all students. Per-student enrolment would be a natural next step.
- There is no admin screen yet; campus data is managed in MongoDB.

## Project layout

```
server/src
  index.js            Express app and startup (also auto-seeds)
  models/             User, Building, Course, Event, Announcement, Task, ChatMessage
  routes/             auth, buildings, dashboard, announcements, events, courses, tasks, chat
  services/ai.js      OpenAI call + campus-data prompt + offline fallback
  services/places.js  matches buildings mentioned in questions and answers
  seed/               sample data and seed script
client/src
  pages/              Landing, AuthPage, Dashboard, Assistant, MapPage, Schedule, Courses, Settings, Help
  components/         AppLayout (sidebar and top bar), map/CampusMap, map/BuildingSheet, RichText...
  lib/                api client, routing (OSRM + geolocation), formatting, category styles
```
