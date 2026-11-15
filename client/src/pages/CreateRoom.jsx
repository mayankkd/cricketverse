import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Shield, Users, Lock, Globe, ArrowRight, Trophy } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { sound } from '../services/sound';

export const CreateRoom = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: 'Cricketverse Arena Clash',
    format: 'T20',
    maxTeams: 6,
    isPrivate: false,
    password: '',
    allowSpectators: true,
    spectatorChatEnabled: true,
    teamName: user ? `${user.username}'s XI` : 'Bengaluru Titans'
  });
  const [loading, setLoading] = useState(false);

  // STRICTLY 3 CRICKET FORMATS WITH DEFAULT FIXED PURSES (Test: 50, ODI: 40, T20: 30)
  const formats = [
    {
      id: 'Test',
      label: 'TEST CRICKET',
      purse: 50,
      badge: '50 POINTS PURSE',
      desc: 'Two innings per side, multi-session stamina, pitch deterioration'
    },
    {
      id: 'ODI',
      label: 'ONE DAY INTERNATIONAL',
      purse: 40,
      badge: '40 POINTS PURSE',
      desc: '50 overs tactical battle, powerplay field restrictions, DLS adjustments'
    },
    {
      id: 'T20',
      label: 'T20 CRICKET',
      purse: 30,
      badge: '30 POINTS PURSE',
      desc: '20 overs high-intensity action, death overs hitting, fast run chases'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);

    try {
      const selectedFormatObj = formats.find(f => f.id.toUpperCase() === formData.format.toUpperCase()) || formats[2];
      const payload = {
        name: formData.name.trim(),
        format: selectedFormatObj.id,
        budgetPerTeam: selectedFormatObj.purse,
        maxTeams: Number(formData.maxTeams),
        isPrivate: Boolean(formData.isPrivate),
        password: formData.password ? formData.password.trim() : '',
        allowSpectators: true,
        spectatorChatEnabled: true,
        teamName: formData.teamName.trim()
      };

      const res = await api.createRoom(payload);
      if (res.success && res.room) {
        addToast({
          type: 'success',
          title: 'ROOM CREATED',
          message: `Lobby ready with code: ${res.room.roomCode}`
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
      addToast({
        type: 'error',
        title: 'ROOM ERROR',
        message: err.message || 'Could not create room'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pitch-500/10 border border-pitch-500/40 text-pitch-400 mb-3 shadow-pitch-glow">
          <PlusCircle className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
          CREATE MULTIPLAYER ROOM
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          CHOOSE CRICKET FORMAT, INVITE FRIENDS & SPECTATORS
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-stadium-900 border border-stadium-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
      >
        {/* Room Title & Host Team Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Room Title
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Weekend Cricketverse Clash"
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Your Team Name
            </label>
            <input
              type="text"
              required
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder="e.g. Bangalore Royal XI"
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500 transition-colors"
            />
          </div>
        </div>

        {/* Cricket Format Selection (Test 50, ODI 40, T20 30) */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-2">
            Cricket Format & Auction Purse
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {formats.map((fmt) => {
              const isSelected = formData.format.toUpperCase() === fmt.id.toUpperCase();
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setFormData({ ...formData, format: fmt.id });
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-gold-500/10 border-gold-500 text-gold-300 shadow-gold-glow'
                      : 'bg-stadium-950 border-stadium-800 text-slate-400 hover:text-white hover:border-stadium-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-black text-sm uppercase text-white">
                      {fmt.label}
                    </span>
                    <Trophy className={`w-4 h-4 ${isSelected ? 'text-gold-400' : 'text-slate-600'}`} />
                  </div>
                  <span className="inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 mb-2">
                    {fmt.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    {fmt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Player Slots (Min 2, Max 6) */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
            Active Players (Fixed Min 2, Max 6)
          </label>
          <select
            value={formData.maxTeams}
            onChange={(e) => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
            className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pitch-500 font-mono"
          >
            {[2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} Active Players {num === 6 ? '(Maximum Player Capacity)' : ''}
              </option>
            ))}
          </select>
          <span className="text-[11px] font-mono text-slate-400 mt-1.5 block">
            Friends 7 and above automatically join as Spectators to watch live.
          </span>
        </div>

        {/* Private Room Option */}
        <div className="p-4 bg-stadium-950 rounded-2xl border border-stadium-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {formData.isPrivate ? <Lock className="w-4 h-4 text-gold-400" /> : <Globe className="w-4 h-4 text-pitch-400" />}
              <span className="text-xs font-mono font-bold uppercase text-white">
                {formData.isPrivate ? 'Private Room (Password Protected)' : 'Public Room'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setFormData({ ...formData, isPrivate: !formData.isPrivate });
              }}
              className={`text-xs font-display font-bold uppercase px-3 py-1.5 rounded-xl border transition-colors ${
                formData.isPrivate ? 'bg-gold-500/20 text-gold-400 border-gold-500/40' : 'bg-stadium-800 text-slate-300 border-stadium-700'
              }`}
            >
              Toggle Password
            </button>
          </div>

          {formData.isPrivate && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Room Password
              </label>
              <input
                type="password"
                required={formData.isPrivate}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password for room"
                className="w-full bg-stadium-900 border border-stadium-700 rounded-xl px-4 py-2 text-xs text-white"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pitch-600 hover:bg-pitch-500 disabled:opacity-50 text-white font-display uppercase font-bold text-sm py-4 rounded-xl shadow-pitch-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? 'CREATING ROOM...' : (
            <>
              LAUNCH LOBBY & INVITE FRIENDS <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
};
