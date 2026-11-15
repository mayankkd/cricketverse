# 🏏 CRICKETVERSE — The Ultimate Cricket Gaming Universe

> **CRICKETVERSE** is an authoritative, full-stack multiplayer cricket management and gaming simulation platform built with Node.js, Express, Socket.IO, MongoDB (with resilient dual-layer in-memory fallback), Phaser 3, React 18, Tailwind CSS, and Recharts.

---

## 🌟 Executive Summary & Key Highlights

- **FIFA Ultimate Team (FUT) Style Cricket Cards**: Collectible cards with 3D tilt & glare physics across multiple tiers (`ICON`, `DIAMOND`, `GOLD`, `SILVER`, `EMERGING`) and card variants (`Peak`, `Best`, `Average`, `Legends`, `World Cup`, `All-Time Great`, `Clutch`).
- **Real-Time Multiplayer Auction Arena**: Authoritative Socket.IO auction hammer engine with fixed starting price of **exactly 1 point**, format-based purses (Test: 50, ODI: 40, T20: 30), single-appearance cricketer rule, and 2 atomic T2 Veto tokens.
- **Interactive 2D Phaser 3 Game**: Live playable physics engine featuring bowling run-up, swing, spin, seam, bat-ball collision, lofted drives, boundary animations, dismissals (Bowled, Caught, LBW, Stumping, Run Out), and manual/tactical control modes.
- **Synchronized Multiplayer Match Engine**: Authoritative server-side seeded randomness, monotonic sequence numbers, idempotency tokens, reconnection recovery, 6-player fixed capacity, and Seventh-Person spectator isolation.
- **Comprehensive Match Formats & 15 Stadiums**: Authentic Test (sessions, follow-on, Day 5 draw), ODI (Powerplay, DLS rain calculations), and T20 rules across 15 iconic venues (Lord's, MCG, Eden Gardens, Wankhede, Chepauk, Chinnaswamy, etc.) with real pitch and weather dynamics.
- **Broadcast Experience & Analytics**: Live wagon wheel, pitch map, over-by-over Manhattan chart, worm progression, partnerships, fall of wickets, bowling analysis, and three commentary personalities (Professional, Hype, Savage).
- **Tournaments & Franchise Legacy**: 10 game modes, points table with official ICC Net Run Rate (NRR) formula, individual awards (Orange Cap, Purple Cap, MVP), multi-season franchise career retention, and inter-team transfers.
- **Advanced Simulation Systems**: Form, confidence, fitness, fatigue, injuries, 6 training drills, 4 recovery regimens, historical partnerships, 8 signature special abilities, DRS UltraEdge snickometer reviews, opponent scouting, and 5-act match documentary generator.
- **Web Audio API Procedural Sound**: Willow bat cracks, crowd roars, gasps, DRS beeps, and auction gavels synthesized in real-time with zero external audio assets.
- **Enterprise Security**: JWT auth, bcrypt password hashing, input validation, sliding window rate limiting, room isolation, and atomic mutex locks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Phaser 3, Tailwind CSS, Framer Motion, Recharts, Canvas Confetti, Lucide React, Socket.IO Client |
| **Backend** | Node.js v24, Express.js, Socket.IO, Mongoose, bcryptjs, jsonwebtoken, validator, morgan, dotenv |
| **Database** | MongoDB (with automatic dual in-memory / file-persisted fallback for zero-config execution) |
| **Audio** | HTML5 Web Audio API procedural synthesis engine |
| **Testing** | 200 in-process automated unit, integration, and security tests |

---

## 🚀 Quickstart & Local Setup on macOS

The application is engineered to run seamlessly on macOS with or without a running MongoDB daemon.

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v24 recommended)
- **npm**: v9.0.0 or later
- **MongoDB** *(Optional)*: If running locally (`mongodb://127.0.0.1:27017/cricketverse`), the backend connects and synchronizes automatically; if inactive, the resilient in-memory dual database layer activates instantly with identical seed data.

### 2. Installation
Clone the repository and install all dependencies:
```bash
# Clone repository
git clone <repository-url>
cd "cricket verse"

# Install root, server, and client dependencies in one command
npm run install:all
```

### 3. Environment Configuration
Environment files are pre-configured:
- Root: [`.env.example`](file:///.env.example)
- Server: [`server/.env`](file:///server/.env)

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/cricketverse
JWT_SECRET=cricketverse_ultra_secure_jwt_secret_token_2026_ipl_fut_champions
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
RATE_LIMIT_ENABLED=true
```

### 4. Database Seeding
To populate MongoDB (or inspect the in-memory seed catalog):
```bash
npm run seed
```
To force-reset and reseed an existing MongoDB database:
```bash
node server/src/data/seed.js --force
```

### 5. Running the Application
Start both the backend server and frontend client concurrently:
```bash
npm run dev
```
- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:5001](http://localhost:5001)
- **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🔑 Demo Access & Pre-Seeded Accounts

### Demo Manager Account
You can log in using the **1-Click VIP Demo** button on the login screen, or with credentials:
- **Email**: `captain@cricketverse.com`
- **Password**: `password123`
- **Franchise**: Royal Challengers Bengaluru (Legend Tier • 1845 ELO • Level 14)

### Demo Multiplayer Room
- **Room Code**: `IPL-2026`
- **Format**: T20 (30 Points Purse)
- **Invitation Token**: `inv_ipl2026_demo`
- **Active Participants**: Pre-seeded with active players, T2 veto tokens, and allocated franchise squads.

---

## 🧪 Automated Test Suite (200 Tests Passing)

CRICKETVERSE includes a comprehensive in-process automated test suite covering all 13 phases.

Run the entire test suite:
```bash
npm run test:server
```

### Test Coverage Summary:
- **Phase 1 & 2 (17 Tests)**: Health check, user registration, JWT generation, password validation, demo login, player database queries, format eligibility filters, 14-attribute comparisons.
- **Phase 3: Multiplayer Rooms & Spectators (13 Tests)**: Fixed capacity 6, Seventh-Person spectator rule, spectator action rejection, invitation tokens, revocation, role restoration upon reconnect, concurrent join mutex lock.
- **Phase 4: Live Auction Engine (17 Tests)**: 1-point starting price, Test/ODI/T20 purses, bid increments, budget validation, unique player appearance, OVR/variant duplicate rejection, permanent veto barring, atomic veto tokens.
- **Phase 5: Team Management (10 Tests)**: Squad limits, Playing XI 11 unique players, auction ownership enforcement, cross-team uniqueness, captain/wicketkeeper assignment.
- **Phase 6: Tactical Management (12 Tests)**: 6 batting strategies, bowling roles, 5 ICC field placement presets, outfield restriction validation.
- **Phase 7 & 8: Gameplay & Match Engine (26 Tests)**: Seeded deterministic randomness, manual batting shots, bowling variations, dismissals, turn sequencing, idempotency tokens, reconnection event replay, match completion.
- **Phase 9: Formats & Stadiums (12 Tests)**: 15 authentic stadiums, boundary dimensions, pitch/weather multipliers, dew, cracked pitch, Test follow-on, Day 5 draw, ODI DLS rain calculations.
- **Phase 10: Broadcast & Analytics (12 Tests)**: Commentary personas, wagon wheel, pitch map, Manhattan charts, partnerships, fall of wickets, bowling scorecards, highlights.
- **Phase 11: Tournaments & Franchise Legacy (12 Tests)**: 10 game modes, 2–6 team limits, points table, official ICC Net Run Rate (NRR) formula, tournament caps, multi-season retentions, inter-team transfers.
- **Phase 12: Advanced Systems (12 Tests)**: 6 training drills, 4 recovery actions, historical partnerships with clamped $[0.95, 1.08]$ synergy, 8 special abilities, DRS review, opponent scouting, 5-act documentary.
- **Phase 13: QA Verification & Security (53 Tests)**: Exhaustive verification across all multiplayer, player, auction, match, and security requirements.

**Total**: `200 PASSED, 0 FAILED`.

---

## 🛡️ Security Architecture

1. **Authentication & Authorization**:
   - Industry-standard JSON Web Tokens (JWT) with 7-day expiration.
   - bcrypt password hashing with 10 salt rounds (plain-text passwords never stored or logged).
   - Role-based authorization distinguishing host, players, and read-only spectators.
2. **API & Handshake Validation**:
   - Strict input validation on all REST payloads using Validator.js.
   - Socket.IO connection handshake middleware verifies JWT tokens before attaching session state.
3. **Auction & Transaction Security**:
   - Mutex locks on bidding and veto operations prevent race conditions.
   - Server-authoritative purse deductions and card ownership assignment.
4. **Rate Limiting**:
   - In-memory sliding-window rate limiting protecting public endpoints (`120 req/min`) and auth endpoints (`30 req/min`).
   - Emits standard RFC headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) and returns HTTP 429 when exceeded.
5. **Room Isolation**:
   - Strict room code namespacing prevents Socket.IO events and match states from leaking across active games.

---

## 🚢 Deployment Guide

### Production Frontend Build
```bash
npm run build
```
Generates minified, optimized production assets in `client/dist/`.

### Serving in Production
- **Backend**: Set `NODE_ENV=production` and run `npm run server` or manage via PM2:
  ```bash
  pm2 start server/src/server.js --name "cricketverse-api"
  ```
- **Frontend**: Serve `client/dist/` through Nginx, Caddy, Vercel, Netlify, or as static files via Express.
- **Reverse Proxy**: Point your reverse proxy to forward `/api` and Socket.IO `/socket.io/` requests to port `5001`.

---

## 📜 License
MIT License. Crafted with passion for the global cricket gaming community.
