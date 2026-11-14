import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Trophy,
  Coins,
  Shield,
  Radio,
  Flame,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  Users,
  Layers,
  Activity
} from 'lucide-react';
import { sound } from '../../services/sound';

export const Navbar = () => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Layers },
    { name: 'Rooms', path: '/rooms/join', icon: Users },
    { name: 'Player Cards', path: '/players', icon: Shield },
    { name: 'Live Auction', path: '/auction', icon: Flame },
    { name: 'Squad XI', path: '/teams', icon: Trophy },
    { name: 'Match Center', path: '/matches', icon: Activity },
    { name: 'Tournaments', path: '/tournaments', icon: Trophy }
  ];

  const formatBudget = (budget) => {
    if (!budget) return '₹100 Cr';
    const cr = budget / 10000000;
    return `₹${cr.toFixed(1)} Cr`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-stadium-950/90 backdrop-blur-md border-b border-stadium-800 shadow-xl">
      {/* Top IPL Broadcast Live Ticker Banner */}
      <div className="bg-gradient-to-r from-red-950 via-stadium-900 to-amber-950 px-4 py-1 border-b border-red-500/20 text-xs flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            <Radio className="w-3 h-3 animate-spin" /> LIVE IPL FINAL
          </span>
          <span className="font-display font-semibold text-slate-300 hidden sm:inline">
            Bangalore Royal Titans 184/4 (18.2 ov) vs Mumbai Kings XI 178/6 (20 ov)
          </span>
          <span className="text-gold-400 font-bold hidden md:inline">
            • BRT need 7 runs in 10 balls
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/matches"
            onClick={() => sound.playClick()}
            className="text-[11px] font-mono text-gold-400 hover:text-gold-300 font-bold underline flex items-center gap-1"
          >
            ENTER MATCH ARENA →
          </Link>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={() => sound.playClick()}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-amber-500 to-pitch-500 p-0.5 shadow-gold-glow flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-stadium-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">🏏</span>
              </div>
            </div>
            <div>
              <span className="font-display text-2xl font-black tracking-wider text-white flex items-center">
                CRICKET<span className="text-gold-400">VERSE</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-pitch-400 block -mt-1 font-bold">
                MULTIPLAYER PRO ARENA
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => sound.playClick()}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display uppercase tracking-wider font-bold transition-all ${
                    isActive
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30 shadow-gold-glow'
                      : 'text-slate-300 hover:text-white hover:bg-stadium-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* User Status / Auth Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Budget Coins Badge */}
                <div className="hidden sm:flex items-center gap-1.5 bg-stadium-900 border border-gold-500/40 px-3 py-1.5 rounded-xl shadow-gold-glow">
                  <Coins className="w-4 h-4 text-gold-400 animate-bounce" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-400 uppercase leading-none">Auction Purse</span>
                    <span className="font-display font-bold text-xs text-gold-300 leading-none mt-0.5">
                      {formatBudget(user?.budget)}
                    </span>
                  </div>
                </div>

                {/* Rating / Tier Badge */}
                <div className="hidden md:flex items-center gap-1.5 bg-stadium-900 border border-pitch-500/30 px-3 py-1.5 rounded-xl">
                  <Trophy className="w-4 h-4 text-pitch-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-400 uppercase leading-none">Tier & Rating</span>
                    <span className="font-display font-bold text-xs text-pitch-300 leading-none mt-0.5">
                      {user?.tier || 'Rookie'} • {user?.rating || 1200}
                    </span>
                  </div>
                </div>

                {/* Create Room Quick Button */}
                <Link
                  to="/rooms/create"
                  onClick={() => sound.playClick()}
                  className="hidden xl:flex items-center gap-1.5 bg-gradient-to-r from-pitch-600 to-pitch-500 hover:from-pitch-500 hover:to-pitch-400 text-white font-display uppercase font-bold text-xs px-3 py-2 rounded-xl shadow-pitch-glow transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" /> CREATE ROOM
                </Link>

                {/* Profile Avatar & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setProfileDropdownOpen(!profileDropdownOpen);
                    }}
                    className="flex items-center gap-2 p-1 rounded-xl bg-stadium-900 border border-stadium-700 hover:border-gold-500/50 transition-colors"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                      alt={user?.username}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10"
                    />
                    <span className="font-display font-bold text-xs text-slate-200 hidden sm:inline max-w-[100px] truncate">
                      {user?.username}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-stadium-900 border border-stadium-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-stadium-800">
                        <p className="font-display font-bold text-sm text-white truncate">{user?.username}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <p className="text-[10px] font-mono text-gold-400 mt-1">{user?.favoriteTeam}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => {
                            sound.playClick();
                            setProfileDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-stadium-800 hover:text-white rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4 text-gold-400" /> Manager Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => {
                            sound.playClick();
                            setProfileDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-stadium-800 hover:text-white rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4 text-electric-400" /> Game Settings
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-stadium-800">
                        <button
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" /> Exit Dugout (Logout)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await demoLogin();
                    navigate('/dashboard');
                  }}
                  className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 font-display uppercase font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-gold-glow flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-gold-400" /> Instant Demo
                </button>
                <Link
                  to="/login"
                  onClick={() => sound.playClick()}
                  className="text-slate-300 hover:text-white font-display uppercase font-bold text-xs px-3 py-2 rounded-xl hover:bg-stadium-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => sound.playClick()}
                  className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-3 py-2 rounded-xl shadow-gold-glow transition-transform active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-stadium-900 border border-stadium-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stadium-950 border-b border-stadium-800 p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  sound.playClick();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-display uppercase font-bold ${
                  isActive ? 'bg-gold-500/20 text-gold-400' : 'text-slate-300 hover:bg-stadium-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
          {isAuthenticated && (
            <div className="pt-2 border-t border-stadium-800 flex flex-col gap-2">
              <Link
                to="/rooms/create"
                onClick={() => {
                  sound.playClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 bg-pitch-600 text-white font-display uppercase font-bold text-xs py-2.5 rounded-xl"
              >
                <PlusCircle className="w-4 h-4" /> Create New Room
              </Link>
              <Link
                to="/profile"
                onClick={() => {
                  sound.playClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-2"
              >
                <User className="w-4 h-4 text-gold-400" /> My Profile
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
