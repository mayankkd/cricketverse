import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sliders, Save, Check } from 'lucide-react';
import { sound } from '../../services/sound';

export const ConfigureSquadLimitsModal = ({
  isOpen,
  onClose,
  currentLimits = {},
  onSave
}) => {
  const [testLimit, setTestLimit] = useState(currentLimits.test || 15);
  const [odiLimit, setOdiLimit] = useState(currentLimits.odi || 15);
  const [t20Limit, setT20Limit] = useState(currentLimits.t20 || 13);
  const [maxSquad, setMaxSquad] = useState(currentLimits.maxSquadSize || 15);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    onSave({
      test: Number(testLimit),
      odi: Number(odiLimit),
      t20: Number(t20Limit),
      maxSquadSize: Number(maxSquad),
      playingXISize: 11
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stadium-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-widest block">
                HOST TOURNAMENT CONTROLS
              </span>
              <h3 className="font-display text-xl font-black uppercase text-white">
                CONFIGURE SQUAD LIMITS
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stadium-800 hover:bg-stadium-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-5 text-xs font-mono">
          <div>
            <label className="text-slate-400 uppercase font-bold block mb-1">
              Test Match Squad Limit (Default: 15)
            </label>
            <input
              type="number"
              min={11}
              max={25}
              value={testLimit}
              onChange={(e) => setTestLimit(e.target.value)}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="text-slate-400 uppercase font-bold block mb-1">
              ODI Squad Limit (Default: 15)
            </label>
            <input
              type="number"
              min={11}
              max={25}
              value={odiLimit}
              onChange={(e) => setOdiLimit(e.target.value)}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="text-slate-400 uppercase font-bold block mb-1">
              T20 Squad Limit (Default: 13)
            </label>
            <input
              type="number"
              min={11}
              max={25}
              value={t20Limit}
              onChange={(e) => setT20Limit(e.target.value)}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="text-slate-400 uppercase font-bold block mb-1">
              Maximum Overall Squad Size
            </label>
            <input
              type="number"
              min={11}
              max={30}
              value={maxSquad}
              onChange={(e) => setMaxSquad(e.target.value)}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="p-3 bg-stadium-950/50 rounded-xl border border-white/5 text-[11px] text-slate-400">
            Playing XI remains strictly fixed at 11 players for match center simulation.
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stadium-800">
            <button
              type="button"
              onClick={onClose}
              className="py-3 rounded-xl border border-stadium-700 text-slate-300 hover:bg-stadium-800 font-display font-bold uppercase text-xs"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-display font-black uppercase text-xs shadow-gold-glow flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> APPLY LIMITS
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

