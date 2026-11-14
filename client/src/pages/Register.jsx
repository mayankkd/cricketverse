import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, User, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../services/sound';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    favoriteTeam: 'Royal Challengers Bengaluru'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    sound.playClick();
    setErrorMsg('');

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      sound.playSixHit();
      navigate('/dashboard');
    } else {
      setErrorMsg(result.message || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pitch-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-stadium-900/90 border border-stadium-750 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pitch-500/10 border border-pitch-500/40 text-pitch-400 mb-3 shadow-pitch-glow">
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-wide">
            FOUND YOUR FRANCHISE
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            CREATE YOUR OFFICIAL MANAGER PASSPORT
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Manager Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. CaptainVirat"
                className="w-full bg-stadium-950 border border-stadium-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="manager@cricketverse.com"
                className="w-full bg-stadium-950 border border-stadium-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Password (Min 6 Characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-stadium-950 border border-stadium-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Primary Franchise Affinity
            </label>
            <select
              value={formData.favoriteTeam}
              onChange={(e) => setFormData({ ...formData, favoriteTeam: e.target.value })}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500 transition-colors"
            >
              {franchiseTeams.map((team) => (
                <option key={team} value={team} className="bg-stadium-900 text-white">
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-stadium-950/70 border border-white/5 rounded-xl text-slate-400 text-[11px] font-mono flex items-center justify-between">
            <span>STARTING AUCTION PURSE:</span>
            <span className="text-gold-400 font-bold text-xs">₹100.0 Cr (1,000,000,000)</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pitch-600 hover:bg-pitch-500 disabled:opacity-50 text-white font-display uppercase font-bold text-sm py-3 rounded-xl shadow-pitch-glow transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                FOUNDING FRANCHISE...
              </span>
            ) : (
              <>
                REGISTER & ENTER STADIUM <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have a manager account?{' '}
          <Link to="/login" className="text-pitch-400 hover:underline font-bold">
            Sign In Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
