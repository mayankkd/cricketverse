import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Trophy,
  Coins,
  Award,
  Zap,
  CheckCircle2,
  Edit2,
  Save,
  Flame,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../services/sound';

export const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam || 'Royal Challengers Bengaluru');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80');

  const franchiseTeams = [
    'Royal Challengers Bengaluru',
    'Mumbai Indians',
    'Chennai Super Kings',
    'Sunrisers Hyderabad',
    'Kolkata Knight Riders',
    'Gujarat Titans',
    'Rajasthan Royals',
    'Delhi Capitals',
    'Lucknow Super Giants',
    'Punjab Kings'
  ];

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'
  ];

  const handleSave = async () => {
    sound.playClick();
    await updateUserProfile({ favoriteTeam, avatar });
    setEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Box */}
      <div className="bg-stadium-900 border border-stadium-800 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group">
            <img
              src={avatar}
              alt="Manager Avatar"
              className="w-28 h-28 rounded-3xl object-cover border-4 border-gold-400 shadow-gold-glow"
            />
            {editing && (
              <div className="absolute inset-0 bg-stadium-950/70 rounded-3xl flex items-center justify-center text-xs font-mono text-gold-400 font-bold">
                SELECT BELOW
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
              <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase">
                {user?.tier || 'Legend'} Manager
              </span>
              <span className="bg-pitch-500/20 text-pitch-400 border border-pitch-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full">
                Level {user?.level || 14} • {user?.xp || 4850} XP
              </span>
            </div>

            <h1 className="font-display text-4xl font-black uppercase text-white tracking-wide">
              {user?.username}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {user?.email} • MEMBER SINCE 2026
            </p>

            {editing ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  className="bg-stadium-950 border border-gold-500/40 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {franchiseTeams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={handleSave}
                  className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-gold-glow"
                >
                  <Save className="w-4 h-4" /> Save Profile
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-center md:justify-start gap-3">
                <span className="font-display font-bold text-sm text-gold-400">
                  Franchise: {user?.favoriteTeam}
                </span>
                <button
                  onClick={() => {
                    sound.playClick();
                    setEditing(true);
                  }}
                  className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 border border-stadium-700 px-2 py-1 rounded-lg"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
            )}
          </div>

          <div className="bg-stadium-950/80 border border-white/5 p-4 rounded-2xl text-center min-w-[160px]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Global ELO Rating</span>
            <span className="font-display font-black text-3xl text-gold-400">{user?.rating || 1845}</span>
            <span className="text-[10px] font-mono text-pitch-400 block mt-1">Top 1% Worldwide</span>
          </div>
        </div>

        {/* Avatar Preset Selector when editing */}
        {editing && (
          <div className="mt-6 pt-6 border-t border-stadium-800">
            <p className="text-xs font-mono text-slate-300 font-bold mb-3 uppercase">
              Select Profile Picture Preset:
            </p>
            <div className="flex gap-3">
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setAvatar(preset)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-transform ${
                    avatar === preset ? 'border-gold-400 scale-110 shadow-gold-glow' : 'border-stadium-700 opacity-60'
                  }`}
                >
                  <img src={preset} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Career Statistics Grid */}
      <div>
        <h2 className="font-display text-2xl font-black uppercase text-white mb-4">
          CAREER RECORD & ANALYTICS
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Matches Played</span>
            <span className="font-display font-black text-2xl text-white mt-1 block">
              {user?.stats?.matchesPlayed || 48}
            </span>
          </div>
          <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Matches Won</span>
            <span className="font-display font-black text-2xl text-pitch-400 mt-1 block">
              {user?.stats?.matchesWon || 34}
            </span>
          </div>
          <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Win Ratio</span>
            <span className="font-display font-black text-2xl text-gold-400 mt-1 block">
              {user?.stats?.winRate || 70.8}%
            </span>
          </div>
          <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Highest Innings</span>
            <span className="font-display font-black text-2xl text-electric-400 mt-1 block">
              {user?.stats?.highestScore || 236}
            </span>
          </div>
          <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Runs</span>
            <span className="font-display font-black text-2xl text-white mt-1 block">
              {user?.stats?.totalRuns || 4210}
            </span>
          </div>
          <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Auctions Won</span>
            <span className="font-display font-black text-2xl text-amber-400 mt-1 block">
              {user?.stats?.auctionsWon || 18}
            </span>
          </div>
        </div>
      </div>

      {/* Trophy Cabinet */}
      <div>
        <h2 className="font-display text-2xl font-black uppercase text-white mb-4">
          FRANCHISE TROPHY CABINET
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stadium-900 border border-gold-500/40 p-6 rounded-3xl shadow-gold-glow flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-gold-400 uppercase">Season 2025</span>
              <h4 className="font-display text-lg font-bold uppercase text-white">IPL Champions Cup</h4>
              <p className="text-xs text-slate-400">Defeated Mumbai Kings XI in Final</p>
            </div>
          </div>

          <div className="bg-stadium-900 border border-pitch-500/40 p-6 rounded-3xl shadow-pitch-glow flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-pitch-500/20 border border-pitch-500/50 flex items-center justify-center text-3xl">
              🥇
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-pitch-400 uppercase">Summer 2025</span>
              <h4 className="font-display text-lg font-bold uppercase text-white">Mega Auction Golden Gavel</h4>
              <p className="text-xs text-slate-400">Constructed #1 Overall Team Chemistry</p>
            </div>
          </div>

          <div className="bg-stadium-900 border border-electric-500/40 p-6 rounded-3xl shadow-electric-glow flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-electric-500/20 border border-electric-500/50 flex items-center justify-center text-3xl">
              🎖️
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-electric-400 uppercase">Clan Championship</span>
              <h4 className="font-display text-lg font-bold uppercase text-white">Super Over Dominator</h4>
              <p className="text-xs text-slate-400">Undefeated 12-0 in Blitz Matches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
