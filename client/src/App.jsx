import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Landing is eagerly loaded for instant initial render
import { Landing } from './pages/Landing';

// Route-based code splitting for lazy-loaded feature pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const CreateRoom = lazy(() => import('./pages/CreateRoom').then(m => ({ default: m.CreateRoom })));
const JoinRoom = lazy(() => import('./pages/JoinRoom').then(m => ({ default: m.JoinRoom })));
const RoomLobby = lazy(() => import('./pages/RoomLobby').then(m => ({ default: m.RoomLobby })));
const RoomInvite = lazy(() => import('./pages/RoomInvite').then(m => ({ default: m.RoomInvite })));
const PlayerDatabase = lazy(() => import('./pages/PlayerDatabase').then(m => ({ default: m.PlayerDatabase })));
const AuctionDashboard = lazy(() => import('./pages/AuctionDashboard').then(m => ({ default: m.AuctionDashboard })));
const TeamDashboard = lazy(() => import('./pages/TeamDashboard').then(m => ({ default: m.TeamDashboard })));
const MatchCenter = lazy(() => import('./pages/MatchCenter').then(m => ({ default: m.MatchCenter })));
const TournamentDashboard = lazy(() => import('./pages/TournamentDashboard').then(m => ({ default: m.TournamentDashboard })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const BroadcastMode = lazy(() => import('./pages/BroadcastMode'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3" role="status" aria-live="polite">
    <div className="w-10 h-10 rounded-full border-2 border-gold-500/20 border-t-gold-400 animate-spin" />
    <span className="font-display uppercase tracking-widest text-xs font-bold text-slate-400">Loading Stadium...</span>
  </div>
);

export function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-stadium-950 text-slate-100 selection:bg-gold-500 selection:text-slate-950">
            <Navbar />
            <main className="flex-1">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
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

                    {/* 6. Create room (Open to all, auto-assigns host session) */}
                    <Route path="/rooms/create" element={<CreateRoom />} />

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
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

