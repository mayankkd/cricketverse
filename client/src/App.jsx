import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// 14 Core Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { RoomLobby } from './pages/RoomLobby';
import { RoomInvite } from './pages/RoomInvite';
import { PlayerDatabase } from './pages/PlayerDatabase';
import { AuctionDashboard } from './pages/AuctionDashboard';
import { TeamDashboard } from './pages/TeamDashboard';
import { MatchCenter } from './pages/MatchCenter';
import { TournamentDashboard } from './pages/TournamentDashboard';
import { Settings } from './pages/Settings';
import BroadcastMode from './pages/BroadcastMode';

export function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-stadium-950 text-slate-100 selection:bg-gold-500 selection:text-slate-950">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* 1. Landing page */}
                <Route path="/" element={<Landing />} />

                {/* 2. Login */}
                <Route path="/login" element={<Login />} />

                {/* 3. Registration */}
                <Route path="/register" element={<Register />} />

                {/* 4. Main dashboard (Protected) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 5. User profile (Protected) */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* 6. Create room (Protected) */}
                <Route
                  path="/rooms/create"
                  element={
                    <ProtectedRoute>
                      <CreateRoom />
                    </ProtectedRoute>
                  }
                />

                {/* 7. Join room */}
                <Route path="/rooms/join" element={<JoinRoom />} />
                <Route path="/rooms/invite/:token" element={<RoomInvite />} />

                {/* 8. Room lobby */}
                <Route path="/rooms/:roomCode" element={<RoomLobby />} />

                {/* 9. Player database */}
                <Route path="/players" element={<PlayerDatabase />} />

                {/* 10. Auction dashboard */}
                <Route path="/auction" element={<AuctionDashboard />} />
                <Route path="/auction/:roomCode" element={<AuctionDashboard />} />

                {/* 11. Team dashboard (Protected) */}
                <Route
                  path="/teams"
                  element={
                    <ProtectedRoute>
                      <TeamDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 12. Match center */}
                <Route path="/matches" element={<MatchCenter />} />
                <Route path="/matches/:matchId" element={<MatchCenter />} />
                <Route path="/match/:matchId" element={<MatchCenter />} />

                {/* 13. Spectator Broadcast Mode */}
                <Route path="/broadcast" element={<BroadcastMode />} />
                <Route path="/broadcast/:matchId" element={<BroadcastMode />} />

                {/* 13. Tournament dashboard */}
                <Route path="/tournaments" element={<TournamentDashboard />} />
                <Route path="/tournaments/:id" element={<TournamentDashboard />} />

                {/* 14. Settings (Protected) */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

