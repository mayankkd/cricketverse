# 🏏 CRICKETVERSE — Phase 1: Project Foundation

> **CRICKETVERSE** is a premium browser-based multiplayer cricket gaming platform inspired by FIFA Ultimate Team (FUT), modern IPL broadcast graphics, and cutting-edge sports game design.

---

## 🌟 Key Highlights & Architecture

- **FIFA Ultimate Team (FUT) Style Cricket Cards**: High-impact collectible cards with 3D tilt & glare physics (`ICON`, `DIAMOND`, `GOLD`, `SILVER`, `EMERGING` tiers) featuring 6 core cricket ratings: Batting (BAT), Bowling (BWL), Fielding (FLD), Power Hitting (PWR), Death Clutch (CLU), and Leadership (LDR).
- **Real-Time Multiplayer Auction Arena**: Live hammer bidding countdown clock, increment buttons (+₹25L, +₹50L, +₹1.00 Cr, +₹2.00 Cr), purse deduction, gavel sound effects, and confetti celebrations upon winning lots.
- **Broadcast Match Center**: Ball-by-ball simulated action, live run rate worm charts, strike rate and economy trackers, and Harsha/Ravi style commentary.
- **Squad XI Tactics**: Chemistry rating meter (0-100%), Captain (C) and Vice-Captain (VC) assignments, and bench reserve management.
- **Resilient Dual Database Layer**: Standard Mongoose schemas with an automatic in-memory/file-persisted fallback for immediate zero-config execution.
- **Procedural Sound Engine**: Willow bat crack, auction chimes, and stadium fanfare synthesized purely with Web Audio API (zero external sound asset lag).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + PostCSS + Autoprefixer
- **Motion & 3D Tilt**: Framer Motion
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Data Visualizations**: Recharts (Pie & Area charts, Over-by-over Worm run progression)
- **Celebration Effects**: Canvas Confetti
- **Multiplayer Sockets**: Socket.IO Client

### Backend
- **Runtime**: Node.js v24
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose (with dual resilient fallback)
- **Real-time Server**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration
- **Security**: bcryptjs password hashing + centralized auth middlewares
- **Validation**: Validator.js + Express input validation middlewares

---

## 📁 Project Directory Structure

```text
cricket verse/
├── package.json                 # Root script runner (dev, install:all, build)
├── README.md                    # Project documentation
│
├── server/                      # Node.js + Express backend
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   ├── src/
│   │   ├── config/              # db.js, jwt.js
│   │   ├── controllers/         # authController, roomController, playerController,
│   │   │                        # teamController, matchController, tournamentController
│   │   ├── data/                # seedData.js (ICON players, teams, matches, tournaments)
│   │   ├── middleware/          # authMiddleware, validationMiddleware, errorMiddleware
│   │   ├── models/              # User, Player, Room, Team, Match, Tournament schemas
│   │   ├── routes/              # Modular Express routers
│   │   ├── services/            # storeService (dual Mongoose & memory store adapter)
│   │   └── server.js            # Express app + Socket.IO server setup
│   └── tests/
│       └── runTests.js          # In-process test suite (16 tests verifying all endpoints)
│
└── client/                      # React + Vite frontend
    ├── package.json
    ├── vite.config.js           # Vite dev server + proxy to backend
    ├── tailwind.config.js       # Custom stadium darks, gold glows, and FUT shadows
    ├── postcss.config.js
    ├── index.html               # Rajdhani & Inter athletic typography fonts
    └── src/
        ├── components/
        │   └── common/          # Navbar, Footer, FutCard, ProtectedRoute
        ├── context/             # AuthContext, NotificationContext
        ├── pages/               # 14 Full Interactive Pages:
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Profile.jsx
        │   ├── CreateRoom.jsx
        │   ├── JoinRoom.jsx
        │   ├── RoomLobby.jsx
        │   ├── PlayerDatabase.jsx
        │   ├── AuctionDashboard.jsx
        │   ├── TeamDashboard.jsx
        │   ├── MatchCenter.jsx
        │   ├── TournamentDashboard.jsx
        │   └── Settings.jsx
        ├── services/            # api.js, sound.js (Web Audio synthesizer)
        ├── App.jsx              # Routes & navigation topology
        ├── main.jsx
        └── index.css            # FUT shield clip-paths, scrollbars, stadium gradients
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
Run the following from the project root:
```bash
npm run install:all
```
*(Or individually: `npm install`, `cd server && npm install`, `cd client && npm install`)*

### 2. Configure Environment Variables
The backend environment is pre-configured in `server/.env`.
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/cricketverse
JWT_SECRET=cricketverse_ultra_secure_jwt_secret_token_2026_ipl_fut_champions
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Start Frontend & Backend Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001](http://localhost:5001)
- **Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

### 4. Running Backend Test Suite
```bash
npm run test:server
```
*(Runs 16 in-process backend tests verifying registration, login, JWT validation, player queries, room lobbies, match simulation, and tournaments).*

---

## 🎮 14 Built Core Pages & Interactive Capabilities

| # | Page | Route | Features & Interactive Functionality |
|---|------|-------|---------------------------------------|
| 1 | **Landing Page** | `/` | Hero section, 3D FUT card carousel, 4-step manager path, 1-click VIP demo access |
| 2 | **Login** | `/login` | Email/password verification, 1-click VIP Demo login button, error toasts |
| 3 | **Registration** | `/register` | Manager registration, IPL franchise affinity picker, starting ₹100 Cr purse |
| 4 | **Main Dashboard** | `/dashboard` | Manager passport card, Win/Loss Recharts pie chart, ELO rating progression area chart, active live match marquee, quick action shortcuts |
| 5 | **User Profile** | `/profile` | Career record (runs, wickets, trophies), franchise avatar selector, trophy cabinet |
| 6 | **Create Room** | `/rooms/create` | T20 / The Hundred / Super Over selector, budget allocator, public/private toggle |
| 7 | **Join Room** | `/rooms/join` | Room passcode entry, searchable public room dugout listings, format filters |
| 8 | **Room Lobby** | `/rooms/:roomCode` | Real-time chat feed, manager ready toggle, room code copy pill, launch auction |
| 9 | **Player Database** | `/players` | Search by name/nation, role & tier filters (ICON, DIAMOND, GOLD), 3D modal inspector |
| 10 | **Auction Dashboard** | `/auction` | Real-time hammer countdown clock, bid buttons (+₹25L, +₹50L, +₹1 Cr, +₹2 Cr), purse deduction, confetti celebration |
| 11 | **Team Dashboard** | `/teams` | Playing XI squad builder, Captain (C) & Vice-Captain (VC) assigner, chemistry score meter |
| 12 | **Match Center** | `/matches` | Live IPL scoreboard, run-rate worm graph, striker/bowler metrics, interactive "Simulate Next Ball" button |
| 13 | **Tournament Dashboard** | `/tournaments` | Official standings points table with NRR, 4-team playoff knockout tree, upcoming fixtures |
| 14 | **Settings** | `/settings` | Willow bat sound FX toggle, commentary language picker, simulation pace, graphics quality |

---

## 🔑 Pre-Seeded Manager Credentials (Instant Testing)

You can use the **1-Click VIP Demo** button on the landing or login page, or manually sign in with:
- **Email**: `captain@cricketverse.com`
- **Password**: `password123`
- **Franchise**: Royal Challengers Bengaluru (Level 14 • 1845 ELO • Legend Tier)

---

## 🛡️ API Endpoints Summary

- `POST /api/auth/register` — Create manager account
- `POST /api/auth/login` — Sign in with email/password
- `POST /api/auth/demo` — 1-click VIP manager auth
- `GET /api/auth/me` — Protected current user info
- `PUT /api/auth/profile` — Update favorite team, avatar, or preferences
- `GET /api/rooms` — Get public multiplayer lobbies
- `GET /api/rooms/:roomCode` — Get room details & participants
- `POST /api/rooms` — Create room
- `POST /api/rooms/:roomCode/join` — Join room
- `POST /api/rooms/:roomCode/chat` — Send chat in lobby
- `PUT /api/rooms/:roomCode/ready` — Toggle ready state
- `GET /api/players` — Search & filter cricket player cards
- `GET /api/players/:id` — Single player details
- `GET /api/teams/my` — User active squad
- `PUT /api/teams/my` — Update Playing XI & captaincy
- `GET /api/matches` — Get live/upcoming matches
- `GET /api/matches/:id` — Get match center details
- `POST /api/matches/:id/simulate-ball` — Simulate ball delivery & update score
- `GET /api/tournaments` — Get tournament standings & playoff brackets

