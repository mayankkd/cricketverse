import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  Users,
  HelpCircle,
  Flame,
  Shield
} from 'lucide-react';
import { sound } from '../../services/sound';
import { HowToPlayModal } from './HowToPlayModal';

export const Navbar = () => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-stadium-950/95 backdrop-blur-md border-b border-stadium-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link
              to="/"
              onClick={() => sound.playClick()}
              className="flex items-center gap-2.5 group"
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
                  MULTIPLAYER CRICKET
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-2">
              <Link
                to="/rooms/create"
                onClick={() => sound.playClick()}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display uppercase tracking-wider font-bold transition-all ${
                  location.pathname === '/rooms/create'
                    ? 'bg-pitch-600 text-white shadow-pitch-glow'
                    : 'text-slate-300 hover:text-white hover:bg-stadium-850'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-pitch-400" />
                CREATE ROOM
              </Link>

              <Link
                to="/rooms/join"
                onClick={() => sound.playClick()}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display uppercase tracking-wider font-bold transition-all ${
                  location.pathname === '/rooms/join'
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-stadium-850'
                }`}
              >
                <Users className="w-4 h-4 text-gold-400" />
                JOIN ROOM
              </Link>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setHowToPlayOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display uppercase tracking-wider font-bold text-slate-300 hover:text-white hover:bg-stadium-850 transition-all"
              >
                <HelpCircle className="w-4 h-4 text-electric-400" />
                HOW TO PLAY
              </button>
            </nav>

            {/* Auth / Profile Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setProfileDropdownOpen(!profileDropdownOpen);
                    }}
                    aria-label="User Account Menu"
                    aria-expanded={profileDropdownOpen}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl bg-stadium-900 border border-stadium-750 hover:border-gold-500/50 transition-colors focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:outline-none"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                      alt={user?.username || 'User avatar'}
                      width="32"
                      height="32"
                      className="w-8 h-8 rounded-lg object-cover border border-white/10"
                    />
                    <span className="font-display font-bold text-xs text-slate-200 hidden sm:inline max-w-[120px] truncate">
                      {user?.username}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-stadium-900 border border-stadium-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-stadium-800">
                        <p className="font-display font-bold text-sm text-white truncate">{user?.username}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
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
                          <User className="w-4 h-4 text-gold-400" /> My Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setProfileDropdownOpen(false);
                            setHowToPlayOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-stadium-800 hover:text-white rounded-lg transition-colors text-left"
                        >
                          <HelpCircle className="w-4 h-4 text-electric-400" /> How to Play
                        </button>
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
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      sound.playClick();
                      await demoLogin();
                    }}
                    className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 font-display uppercase font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-gold-glow flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-gold-400" /> 1-Click Demo
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
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                className="md:hidden p-2 rounded-xl bg-stadium-900 border border-stadium-800 text-slate-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:outline-none"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-stadium-950 border-b border-stadium-800 p-4 space-y-2">
            <Link
              to="/rooms/create"
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-display uppercase font-bold text-white bg-pitch-600 shadow-pitch-glow"
            >
              <PlusCircle className="w-4 h-4" /> Create Room
            </Link>

            <Link
              to="/rooms/join"
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-display uppercase font-bold text-slate-300 hover:bg-stadium-850"
            >
              <Users className="w-4 h-4 text-gold-400" /> Join Room
            </Link>

            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                setHowToPlayOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-display uppercase font-bold text-slate-300 hover:bg-stadium-850 text-left"
            >
              <HelpCircle className="w-4 h-4 text-electric-400" /> How to Play
            </button>

            {isAuthenticated ? (
              <Link
                to="/profile"
                onClick={() => {
                  sound.playClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-display uppercase font-bold text-slate-300 hover:bg-stadium-850"
              >
                <User className="w-4 h-4 text-gold-400" /> My Profile
              </Link>
            ) : null}
          </div>
        )}
      </header>

      {/* How to Play Modal */}
      <HowToPlayModal isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
    </>
  );
};
