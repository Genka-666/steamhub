# 🎬 StreamHub — Next-Gen Video Streaming Platform

> A fullstack video streaming web application inspired by **Netflix**, **Crunchyroll**, and **JioHotstar**, built with **Next.js 16**, **Tailwind CSS**, **Prisma ORM (SQLite)**, and **HLS Adaptive Bitrate (ABR)** video playback.

---

## ✨ Features

### 🖥️ Public Viewer Experience
- **Cinematic Hero Billboard:** Dynamic banner with synopsis, ratings, and instant playback.
- **Adaptive Bitrate Video Player (Hls.js):**
  - Multi-resolution switching (Auto, 1080p, 720p, 480p, 360p).
  - Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).
  - Smart resume: Remembers exact timestamp and automatically picks up where you left off.
  - Skip Intro button during intro timecodes.
  - Auto next episode countdown.
  - Full keyboard shortcuts (`Space`, `F`, `M`, `Arrow keys`).
- **Category Carousels:** Smooth horizontal scrolling with "Continue Watching" progress bars.
- **Multi-Episode Anime & Series Support:** Tabbed season/episode selector with episode thumbnails and durations.
- **Instant Search:** Real-time debounced search by title, genre, and cast.
- **Multi-Profile Switcher:** Personal, Anime Hub, and Kids Zone profiles.

### 🛡️ Admin Control Center (`/admin`)
- **Passkey Protection:** Only authorized administrators can add or delete titles (`admin123`).
- **Content Management Console:**
  - Add single movies or multi-episode anime series/playlists.
  - Direct video stream URL attachment (`.m3u8` HLS or `.mp4`).
  - Delete titles permanently from the SQLite database.
- **Transcoder Engine Simulator:** Interactive FFmpeg multi-bitrate packaging visualizer and command generator.

### ⚙️ Backend Architecture
- **Prisma 6 ORM + SQLite:** Zero configuration required; data persists in a local SQLite database (`prisma/dev.db`).
- **Role-Based Access Control:** Unauthorized `POST` / `DELETE` requests to `/api/titles` are rejected with `403 Forbidden`.
- **Playback Telemetry:** Saves heartbeat timestamps every 5 seconds to `/api/progress`.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up the Database
```bash
# Push Prisma schema to SQLite
npx prisma db push

# (Optional) Seed sample movies and anime
node prisma/seed.js
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🔑 Admin Portal

Visit [http://localhost:3001/admin](http://localhost:3001/admin) to manage your catalog.
- **Default Passkey:** `admin123`

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons
- **Video Engine:** Hls.js, HTML5 Video API
- **Backend & API:** Next.js Route Handlers
- **Database & ORM:** Prisma 6 with SQLite
- **Security:** Token-based header authorization (`x-admin-token`)
