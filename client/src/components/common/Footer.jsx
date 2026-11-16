import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Trophy, Activity, Heart, Radio, Flame } from 'lucide-react';
import { sound } from '../../services/sound';

export const Footer = () => {
  return (
    <footer className="w-full bg-stadium-950 border-t border-stadium-800/80 text-slate-400 text-xs py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-lg">
            🏏
          </div>
          <div>
            <p className="font-display font-bold text-sm text-white tracking-wider">
              CRICKET<span className="text-gold-400">VERSE</span> ENGINE
            </p>
            <p className="text-[11px] text-slate-400 font-sans">
              Browser-Based Multiplayer Cricket • IPL Broadcast & FUT Inspired
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-display uppercase tracking-wider text-[11px] font-semibold text-slate-300">
          <Link to="/dashboard" onClick={() => sound.playClick()} className="hover:text-gold-400 transition-colors focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:outline-none rounded px-1">Dashboard</Link>
          <Link to="/players" onClick={() => sound.playClick()} className="hover:text-gold-400 transition-colors focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:outline-none rounded px-1">Player Database</Link>
          <Link to="/auction" onClick={() => sound.playClick()} className="hover:text-gold-400 transition-colors focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:outline-none rounded px-1">Live Auction</Link>
          <Link to="/matches" onClick={() => sound.playClick()} className="hover:text-gold-400 transition-colors focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:outline-none rounded px-1">Match Center</Link>
          <Link to="/tournaments" onClick={() => sound.playClick()} className="hover:text-gold-400 transition-colors focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:outline-none rounded px-1">Tournaments</Link>
          <Link to="/settings" onClick={() => sound.playClick()} className="hover:text-gold-400 transition-colors focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:outline-none rounded px-1">Settings</Link>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-pitch-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-pitch-500 animate-ping" /> SERVER ONLINE (18ms)
          </span>
          <span>•</span>
          <span>PHASE 1 FOUNDATION</span>
        </div>
      </div>
    </footer>
  );
};

