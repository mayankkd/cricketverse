import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Users,
  HelpCircle,
  User,
  ArrowRight,
  Flame,
  Shield,
  Trophy,
  LogIn,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../services/sound';
import { HowToPlayModal } from '../components/common/HowToPlayModal';

export const Landing = () => {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [quickCode, setQuickCode] = useState('');
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    sound.playClick();
    const cleanCode = quickCode.trim().toUpperCase();
    navigate(`/rooms/${cleanCode}`);
  };

  const handleProfileClick = async () => {
    sound.playClick();
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      await demoLogin();
      navigate('/profile');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden bg-stadium-950">
      {/* Stadium Floodlights & Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[450px] bg-stadium-radial pointer-events-none opacity-60" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-pitch-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full mx-auto text-center space-y-10">
        {/* Branding & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stadium-900 border border-gold-500/40 text-gold-400 text-xs font-mono font-bold uppercase tracking-wider shadow-gold-glow">
            <span className="text-base">🏏</span> MULTIPLAYER CRICKET ENGINE
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-none">
            CRICKET<span className="text-gold-400">VERSE</span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-300 font-medium">
            Play simple, real-time cricket matches with friends while other friends watch live as spectators.
          </p>
        </motion.div>

        {/* 4 Core Main Menu Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left"
        >
          {/* 1. CREATE ROOM */}
          <Link
            to="/rooms/create"
            onClick={() => sound.playClick()}
            className="group p-6 rounded-2xl bg-stadium-900 border border-pitch-500/40 hover:border-pitch-400 hover:bg-stadium-850 transition-all shadow-lg hover:shadow-pitch-glow flex items-start gap-4 active:scale-98 focus-visible:ring-2 focus-visible:ring-pitch-400 focus-visible:outline-none"
          >
            <div className="w-12 h-12 rounded-xl bg-pitch-500/20 border border-pitch-500/40 flex items-center justify-center text-pitch-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg uppercase text-white group-hover:text-pitch-300 transition-colors">
                  CREATE ROOM
                </h2>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pitch-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                Host a private match. Choose Test, ODI or T20, pick a stadium, and invite friends.
              </p>
            </div>
          </Link>

          {/* 2. JOIN ROOM */}
          <Link
            to="/rooms/join"
            onClick={() => sound.playClick()}
            className="group p-6 rounded-2xl bg-stadium-900 border border-gold-500/40 hover:border-gold-400 hover:bg-stadium-850 transition-all shadow-lg hover:shadow-gold-glow flex items-start gap-4 active:scale-98 focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:outline-none"
          >
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg uppercase text-white group-hover:text-gold-300 transition-colors">
                  JOIN ROOM
                </h2>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                Enter as an active player (up to 6) or jump in as a spectator to watch live.
              </p>
            </div>
          </Link>

          {/* 3. HOW TO PLAY */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setHowToPlayOpen(true);
            }}
            className="group p-6 rounded-2xl bg-stadium-900 border border-electric-500/30 hover:border-electric-400 hover:bg-stadium-850 transition-all shadow-lg hover:shadow-electric-glow flex items-start gap-4 active:scale-98 text-left focus-visible:ring-2 focus-visible:ring-electric-400 focus-visible:outline-none"
          >
            <div className="w-12 h-12 rounded-xl bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg uppercase text-white group-hover:text-electric-300 transition-colors">
                  HOW TO PLAY
                </h2>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-electric-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                Simple rules: Format purse (50/40/30), 1-pt auction, Playing XI, and 2D playable cricket.
              </p>
            </div>
          </button>

          {/* 4. MY PROFILE */}
          <button
            type="button"
            onClick={handleProfileClick}
            className="group p-6 rounded-2xl bg-stadium-900 border border-stadium-750 hover:border-gold-500/40 hover:bg-stadium-850 transition-all shadow-lg flex items-start gap-4 active:scale-98 text-left focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:outline-none"
          >
            <div className="w-12 h-12 rounded-xl bg-stadium-800 border border-stadium-700 flex items-center justify-center text-gold-400 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg uppercase text-white group-hover:text-gold-300 transition-colors">
                  MY PROFILE
                </h2>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                {isAuthenticated
                  ? `Signed in as ${user?.username}. View franchise team and records.`
                  : 'Sign in or start an instant 1-click demo to save matches.'}
              </p>
            </div>
          </button>
        </motion.div>

        {/* Quick Room Code Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="max-w-md mx-auto p-4 rounded-2xl bg-stadium-900/80 border border-stadium-800"
        >
          <form onSubmit={handleQuickJoin} className="flex gap-2">
            <label htmlFor="quick-room-code-input" className="sr-only">
              Enter Room Code
            </label>
            <input
              id="quick-room-code-input"
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              placeholder="Enter Room Code (e.g. CRIC-7821)"
              className="flex-1 bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 font-mono uppercase focus-visible:ring-2 focus-visible:ring-gold-400"
            />
            <button
              type="submit"
              aria-label="Join room using entered code"
              className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display font-bold text-xs uppercase px-5 py-2.5 rounded-xl shadow-gold-glow transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:outline-none"
            >
              JOIN NOW
            </button>
          </form>
        </motion.div>
      </div>

      {/* How to Play Modal */}
      <HowToPlayModal isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
    </div>
  );
};
