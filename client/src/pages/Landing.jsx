import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Shield,
  Zap,
  Users,
  Activity,
  ArrowRight,
  Play,
  Sparkles,
  Award,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FutCard } from '../components/common/FutCard';
import { sound } from '../services/sound';

export const Landing = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const featuredPlayers = [
    {
      _id: 'ply_01',
      name: 'Virat Kohli',
      shortName: 'V. Kohli',
      country: 'India',
      countryFlag: '🇮🇳',
      role: 'Batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      overallRating: 96,
      cardTier: 'ICON',
      stats: { bat: 98, bwl: 45, fld: 94, pwr: 92, clu: 99, ldr: 95 },
      basePrice: 200000000,
      currentPrice: 210000000,
      franchise: 'Royal Challengers Bengaluru',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      jerseyNumber: 18,
      specialTraits: ['Chase Master', 'Anchor & Accelerate']
    },
    {
      _id: 'ply_02',
      name: 'Jasprit Bumrah',
      shortName: 'J. Bumrah',
      country: 'India',
      countryFlag: '🇮🇳',
      role: 'Bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast',
      overallRating: 97,
      cardTier: 'ICON',
      stats: { bat: 38, bwl: 99, fld: 86, pwr: 45, clu: 99, ldr: 88 },
      basePrice: 200000000,
      currentPrice: 225000000,
      franchise: 'Mumbai Indians',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      jerseyNumber: 93,
      specialTraits: ['Toe Crusher', 'Zero Economy']
    },
    {
      _id: 'ply_04',
      name: 'Heinrich Klaasen',
      shortName: 'H. Klaasen',
      country: 'South Africa',
      countryFlag: '🇿🇦',
      role: 'Wicketkeeper',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      overallRating: 93,
      cardTier: 'DIAMOND',
      stats: { bat: 95, bwl: 25, fld: 91, pwr: 99, clu: 93, ldr: 80 },
      basePrice: 150000000,
      currentPrice: 175000000,
      franchise: 'Sunrisers Hyderabad',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      jerseyNumber: 4,
      specialTraits: ['Spin Destroyer', 'Death Surge']
    }
  ];

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Stadium Floodlights & Ambient Beams */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-stadium-radial pointer-events-none opacity-80" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-pitch-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stadium-900 border border-gold-500/40 text-gold-400 text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-gold-glow"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" />
            PHASE 1: MULTIPLAYER CRICKET METAVERSE
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase text-white leading-tight"
          >
            COMMAND YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-amber-300 to-yellow-500 drop-shadow-[0_4px_15px_rgba(245,158,11,0.5)]">
              CRICKET DYNASTY
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-300 font-medium leading-relaxed"
          >
            Experience the thrill of real-time multiplayer IPL auctions, FUT-inspired player cards, tactical Playing XI management, and ball-by-ball simulated match centers.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => sound.playClick()}
                className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-gold-glow flex items-center gap-2 transition-transform active:scale-95"
              >
                ENTER DASHBOARD <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => sound.playClick()}
                  className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-gold-glow flex items-center gap-2 transition-transform active:scale-95"
                >
                  START MANAGING NOW <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={async () => {
                    await demoLogin();
                    navigate('/dashboard');
                  }}
                  className="bg-stadium-900 hover:bg-stadium-850 text-gold-300 border border-gold-500/50 font-display uppercase font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Flame className="w-5 h-5 text-gold-400" /> INSTANT 1-CLICK DEMO
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* FUT Card Showcase Carousel / Row */}
        <div className="mt-16">
          <div className="text-center mb-6">
            <span className="text-xs font-mono text-pitch-400 uppercase font-bold tracking-widest block">
              FUT-STYLE ICON COLLECTIBLES
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white mt-1">
              ELITE SQUAD CARDS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {featuredPlayers.map((player) => (
              <FutCard
                key={player._id}
                player={player}
                onClick={() => navigate('/players')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="py-16 bg-stadium-900/60 border-t border-b border-stadium-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-stadium-950/80 border border-stadium-800 p-6 rounded-2xl relative overflow-hidden group hover:border-gold-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-4 text-gold-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-white mb-2">Live Auction Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compete against rival managers in real-time hammer bidding. Manage your ₹100 Cr purse with strategy.
              </p>
            </div>

            <div className="bg-stadium-950/80 border border-stadium-800 p-6 rounded-2xl relative overflow-hidden group hover:border-pitch-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pitch-500/10 border border-pitch-500/30 flex items-center justify-center mb-4 text-pitch-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-white mb-2">FUT Chemistry Cards</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build high-chemistry squads with ICON, Diamond, and Emerging player card rarities and trait synergy.
              </p>
            </div>

            <div className="bg-stadium-950/80 border border-stadium-800 p-6 rounded-2xl relative overflow-hidden group hover:border-electric-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center mb-4 text-electric-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-white mb-2">Ball-by-Ball Match Center</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Broadcast graphics scoreboard, live run rate worm charts, ball simulator, and Harsha/Ravi commentary.
              </p>
            </div>

            <div className="bg-stadium-950/80 border border-stadium-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-white mb-2">Tournament Arenas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Host private clan leagues, join public IPL tournaments, and climb the leaderboard with NRR tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Stadium Path */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-gold-400 font-bold uppercase tracking-widest">
            MANAGER BLUEPRINT
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white mt-1">
            HOW TO CONQUER THE STADIUM
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Claim Franchise', desc: 'Register as manager and set up your club identity, team colors, and stadium.' },
            { step: '02', title: 'Enter Room Lobby', desc: 'Create a customized cricket room or join an active public lobby with room code.' },
            { step: '03', title: 'Win The Auction', desc: 'Bid against real managers under the hammer countdown clock to assemble your squad.' },
            { step: '04', title: 'Simulate & Crown', desc: 'Field your Playing XI, simulate matches ball-by-ball, and lift the Championship trophy.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-stadium-900 border border-stadium-800 p-6 rounded-2xl relative">
              <span className="font-display font-black text-4xl text-slate-700/60 block mb-2">{item.step}</span>
              <h4 className="font-display text-lg font-bold uppercase text-white mb-1.5">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => {
              sound.playClick();
              navigate(isAuthenticated ? '/dashboard' : '/register');
            }}
            className="bg-pitch-600 hover:bg-pitch-500 text-white font-display uppercase font-bold text-sm px-8 py-3.5 rounded-xl shadow-pitch-glow inline-flex items-center gap-2 transition-transform active:scale-95"
          >
            ENTER THE CRICKETVERSE ARENA <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

