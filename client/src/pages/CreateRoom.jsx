import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Shield, Users, Coins, Lock, Globe, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { sound } from '../services/sound';

export const CreateRoom = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: 'Mega IPL Auction & Super League',
    format: 'T20',
    maxTeams: 8,
    budgetPerTeam: 1000000000,
    isPrivate: false,
    password: '',
    teamName: user ? `${user.username}'s XI` : 'Bangalore Royal Titans'
  });
  const [loading, setLoading] = useState(false);

  const formats = [
    { id: 'T20', label: 'T20 Super League', desc: '20 overs, powerplays & death surge' },
    { id: 'The Hundred', label: 'The Hundred', desc: '100 balls per side, fast-paced action' },
    { id: 'Super Over', label: 'Super Over Clash', desc: '6 balls sudden death shootout' },
    { id: 'ODI', label: 'One Day International', desc: '50 overs tactical endurance' }
  ];

  const budgets = [
    { val: 1000000000, label: '₹100 Cr (Official IPL)' },
    { val: 800000000, label: '₹80 Cr (Championship)' },
    { val: 500000000, label: '₹50 Cr (Mini Auction)' },
    { val: 120000000, label: '₹120 Cr (Mega Purse)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);

    try {
      const res = await api.createRoom(formData);
      if (res.success && res.room) {
        addToast({
          type: 'gold',
          title: 'ROOM OPENED',
          message: `Lobby created with code: ${res.room.roomCode}`
        });
        navigate(`/rooms/${res.room.roomCode}`);
      } else {
        addToast({
          type: 'error',
          title: 'FAILED TO CREATE',
          message: res.message || 'Room setup error'
        });
      }
    } catch (err) {
      // Fallback redirect for preview
      navigate(`/rooms/CRIC-7821`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pitch-500/10 border border-pitch-500/40 text-pitch-400 mb-3 shadow-pitch-glow">
          <PlusCircle className="w-7 h-7" />
        </div>
        <h1 className="font-display text-4xl font-black uppercase text-white tracking-wide">
          CREATE MULTIPLAYER ROOM
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          CONFIGURE TOURNAMENT RULES, AUCTION BUDGET & PARTICIPANT SLOTS
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-stadium-900 border border-stadium-800 p-8 rounded-3xl shadow-2xl space-y-6"
      >
        {/* Room Title & Host Team Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Room Title
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mega IPL Auction 2026"
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Your Team / Franchise Name
            </label>
            <input
              type="text"
              required
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder="e.g. Royal Challengers XI"
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500 transition-colors"
            />
          </div>
        </div>

        {/* Cricket Format Selector */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-2">
            Match Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {formats.map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setFormData({ ...formData, format: fmt.id });
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  formData.format === fmt.id
                    ? 'bg-gold-500/10 border-gold-500 text-gold-300 shadow-gold-glow'
                    : 'bg-stadium-950 border-stadium-800 text-slate-400 hover:text-white hover:border-stadium-700'
                }`}
              >
                <span className="font-display font-bold text-sm uppercase block text-white">
                  {fmt.label}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
                  {fmt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Max Teams & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Maximum Manager Slots
            </label>
            <select
              value={formData.maxTeams}
              onChange={(e) => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500"
            >
              {[2, 4, 6, 8, 10].map((num) => (
                <option key={num} value={num}>
                  {num} Teams ({num === 8 ? 'Official 8-Franchise League' : `${num} Managers`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Auction Budget Per Franchise
            </label>
            <select
              value={formData.budgetPerTeam}
              onChange={(e) => setFormData({ ...formData, budgetPerTeam: Number(e.target.value) })}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500"
            >
              {budgets.map((b) => (
                <option key={b.val} value={b.val}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Privacy & Password */}
        <div className="p-4 bg-stadium-950 rounded-2xl border border-stadium-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {formData.isPrivate ? <Lock className="w-4 h-4 text-gold-400" /> : <Globe className="w-4 h-4 text-pitch-400" />}
              <span className="text-xs font-mono font-bold uppercase text-white">
                {formData.isPrivate ? 'Private Room (Password Required)' : 'Public Room (Visible in Lobby)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setFormData({ ...formData, isPrivate: !formData.isPrivate });
              }}
              className={`text-xs font-display font-bold uppercase px-3 py-1 rounded-lg border transition-colors ${
                formData.isPrivate ? 'bg-gold-500/20 text-gold-400 border-gold-500/40' : 'bg-stadium-800 text-slate-300 border-stadium-700'
              }`}
            >
              Toggle Privacy
            </button>
          </div>

          {formData.isPrivate && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Room Access Password
              </label>
              <input
                type="password"
                required={formData.isPrivate}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter secret room pass"
                className="w-full bg-stadium-900 border border-stadium-700 rounded-xl px-4 py-2 text-xs text-white"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pitch-600 hover:bg-pitch-500 disabled:opacity-50 text-white font-display uppercase font-bold text-sm py-4 rounded-xl shadow-pitch-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? 'ESTABLISHING ARENA...' : (
            <>
              LAUNCH LOBBY & INVITE MANAGERS <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
};

