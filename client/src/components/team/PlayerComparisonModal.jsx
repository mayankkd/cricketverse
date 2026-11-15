import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRightLeft, Sparkles, Check, Crown, Shield } from 'lucide-react';
import { FutCard } from '../common/FutCard';
import { sound } from '../../services/sound';

export const PlayerComparisonModal = ({
  isOpen,
  onClose,
  squad = [],
  initialPlayer1 = null,
  initialPlayer2 = null,
  activeFormat = 't20'
}) => {
  const [player1Id, setPlayer1Id] = useState(initialPlayer1?._id || squad[0]?._id);
  const [player2Id, setPlayer2Id] = useState(initialPlayer2?._id || squad[1]?._id || squad[0]?._id);

  if (!isOpen) return null;

  const player1 = squad.find(p => p._id === player1Id) || squad[0];
  const player2 = squad.find(p => p._id === player2Id) || squad[1] || squad[0];

  const getAttr = (p, attr) => {
    if (!p) return 75;
    return p.attributes?.[attr] || p[attr] || p.stats?.[attr] || 80;
  };

  const attributesList = [
    { key: 'batting', label: 'Batting Technique', get: p => p.battingRating || getAttr(p, 'batting') },
    { key: 'bowling', label: 'Bowling Arsenal', get: p => p.bowlingRating || getAttr(p, 'bowling') },
    { key: 'fielding', label: 'Fielding Agility', get: p => p.fieldingRating || getAttr(p, 'fielding') },
    { key: 'fitness', label: 'Fitness & Stamina', get: p => p.fitness || getAttr(p, 'fitness') },
    { key: 'powerHitting', label: 'Power Hitting', get: p => getAttr(p, 'powerHitting') },
    { key: 'strikeRotation', label: 'Strike Rotation', get: p => getAttr(p, 'strikeRotation') },
    { key: 'pace', label: 'Pace / Express Speed', get: p => getAttr(p, 'pace') },
    { key: 'deathBowling', label: 'Death Overs Clutch', get: p => getAttr(p, 'deathBowling') },
    { key: 'temperament', label: 'Match Temperament', get: p => getAttr(p, 'temperament') },
    { key: 'consistency', label: 'Historical Consistency', get: p => getAttr(p, 'consistency') }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl max-h-[90vh] bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-stadium-800 flex items-center justify-between bg-stadium-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-widest block">
                HEAD-TO-HEAD TACTICAL COMPARISON
              </span>
              <h2 className="font-display text-2xl font-black uppercase text-white">
                SQUAD ROSTER COMPARISON
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stadium-800 hover:bg-stadium-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Selectors Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stadium-950/40 p-4 rounded-2xl border border-white/5">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">
                Player 1 Selection
              </label>
              <select
                value={player1Id}
                onChange={(e) => {
                  sound.playClick();
                  setPlayer1Id(e.target.value);
                }}
                className="w-full bg-stadium-900 border border-stadium-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold-500"
              >
                {squad.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.role} • OVR {p.ovr || p.overallRating})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">
                Player 2 Selection
              </label>
              <select
                value={player2Id}
                onChange={(e) => {
                  sound.playClick();
                  setPlayer2Id(e.target.value);
                }}
                className="w-full bg-stadium-900 border border-stadium-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold-500"
              >
                {squad.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.role} • OVR {p.ovr || p.overallRating})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards & Attribute Radar/Bars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Card */}
            <div className="md:col-span-3 flex justify-center">
              <div className="w-full max-w-[220px]">
                <FutCard player={player1} format={activeFormat} compact={true} />
              </div>
            </div>

            {/* Middle Attribute Comparison Bars (6 cols) */}
            <div className="md:col-span-6 space-y-3 bg-stadium-950 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold border-b border-stadium-800 pb-2 mb-2">
                <span className="text-gold-400 truncate max-w-[130px]">{player1?.shortName || player1?.name}</span>
                <span className="text-slate-500 uppercase tracking-widest text-[9px]">1–120 Scale</span>
                <span className="text-cyan-400 truncate max-w-[130px]">{player2?.shortName || player2?.name}</span>
              </div>

              {attributesList.map((attr) => {
                const v1 = attr.get(player1);
                const v2 = attr.get(player2);
                const p1Adv = v1 > v2;
                const p2Adv = v2 > v1;

                return (
                  <div key={attr.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={`font-bold ${p1Adv ? 'text-gold-400 font-black' : 'text-slate-400'}`}>
                        {v1} {p1Adv && '▲'}
                      </span>
                      <span className="text-slate-300 text-[10px] uppercase font-bold">{attr.label}</span>
                      <span className={`font-bold ${p2Adv ? 'text-cyan-400 font-black' : 'text-slate-400'}`}>
                        {p2Adv && '▲'} {v2}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 h-2">
                      {/* Player 1 bar */}
                      <div className="bg-stadium-900 rounded-full overflow-hidden flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${p1Adv ? 'bg-gold-500' : 'bg-gold-500/40'}`}
                          style={{ width: `${Math.min(100, (v1 / 120) * 100)}%` }}
                        />
                      </div>
                      {/* Player 2 bar */}
                      <div className="bg-stadium-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${p2Adv ? 'bg-cyan-500' : 'bg-cyan-500/40'}`}
                          style={{ width: `${Math.min(100, (v2 / 120) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Card */}
            <div className="md:col-span-3 flex justify-center">
              <div className="w-full max-w-[220px]">
                <FutCard player={player2} format={activeFormat} compact={true} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
