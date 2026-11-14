import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Award, Zap, Trophy, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { PlayerImage } from '../common/PlayerImage';
import { sound } from '../../services/sound';

export const PlayerCompareModal = ({ player1, player2, onClose, allPlayers = [], onSwapPlayer = null }) => {
  const [selectedFormat, setSelectedFormat] = useState('odi'); // 'test', 'odi', 't20'

  if (!player1 || !player2) return null;

  const attributesList = [
    { key: 'batting', label: 'Batting Skill' },
    { key: 'bowling', label: 'Bowling Mastery' },
    { key: 'fielding', label: 'Fielding Reflexes' },
    { key: 'fitness', label: 'Physical Fitness' },
    { key: 'temperament', label: 'Big Match Temperament' },
    { key: 'consistency', label: 'Match Consistency' },
    { key: 'captaincy', label: 'Tactical Captaincy' },
    { key: 'powerHitting', label: 'Power Hitting / Sixes' },
    { key: 'strikeRotation', label: 'Strike Rotation' },
    { key: 'pace', label: 'Bowling Pace & Speed' },
    { key: 'swing', label: 'Late Swing Movement' },
    { key: 'spin', label: 'Spin & Drift' },
    { key: 'deathBowling', label: 'Death Over Execution' },
    { key: 'defensiveTechnique', label: 'Defensive Technique' }
  ];

  const getOvr = (p, fmt) => {
    if (!p) return 0;
    if (p.formatEligibility?.[fmt] === false) return 'N/A';
    return p.ovr?.[fmt] || p.overallRating || 90;
  };

  const p1Ovr = getOvr(player1, selectedFormat);
  const p2Ovr = getOvr(player2, selectedFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stadium-950/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="bg-stadium-900 border border-gold-500/50 rounded-3xl max-w-4xl w-full shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stadium-800 bg-stadium-950/70 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gold-400 tracking-wider block">
              HEAD-TO-HEAD CARD COMPARISON
            </span>
            <h2 className="font-display text-2xl font-black uppercase text-white tracking-wide">
              {player1.shortName} <span className="text-slate-500 text-lg">VS</span> {player2.shortName}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Switcher */}
            <div className="flex items-center gap-1 bg-stadium-900 p-1 rounded-xl border border-stadium-750">
              {['test', 'odi', 't20'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    sound.playClick();
                    setSelectedFormat(fmt);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    selectedFormat === fmt
                      ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-stadium-950 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Player Face-Off Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 bg-stadium-950/70 p-4 rounded-2xl border border-white/5">
            {/* Player 1 Card Summary */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border border-gold-500/50 shadow-gold-glow flex-shrink-0">
                <PlayerImage player={player1} format={selectedFormat} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-mono text-gold-400 font-bold block uppercase">
                  {player1.country} • {player1.role}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase truncate">
                  {player1.name}
                </h3>
                <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-2">
                  <span className="font-display font-black text-3xl sm:text-4xl text-gold-400">
                    {p1Ovr}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    {selectedFormat.toUpperCase()} OVR
                  </span>
                </div>
              </div>
            </div>

            {/* Player 2 Card Summary */}
            <div className="flex flex-col sm:flex-row-reverse items-center gap-4 text-center sm:text-right border-l border-stadium-800 pl-4 sm:pl-6">
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border border-cyan-500/50 shadow-electric-glow flex-shrink-0">
                <PlayerImage player={player2} format={selectedFormat} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">
                  {player2.country} • {player2.role}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase truncate">
                  {player2.name}
                </h3>
                <div className="mt-1 flex items-baseline justify-center sm:justify-end gap-2">
                  <span className="font-display font-black text-3xl sm:text-4xl text-cyan-400">
                    {p2Ovr}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    {selectedFormat.toUpperCase()} OVR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 14 Attributes Head-to-Head Comparison Bars */}
          <div className="space-y-3 bg-stadium-950/60 p-5 rounded-2xl border border-white/5">
            <h4 className="font-display font-bold text-sm uppercase text-slate-200 border-b border-stadium-800 pb-2 flex items-center justify-between">
              <span>14 CRICKET ATTRIBUTES (1–120 SCALE)</span>
              <span className="text-[10px] font-mono text-gold-400">GREEN = ADVANTAGE</span>
            </h4>

            <div className="space-y-3 font-mono text-xs">
              {attributesList.map((attr) => {
                const val1 = player1.attributes?.[attr.key] || 0;
                const val2 = player2.attributes?.[attr.key] || 0;
                const p1Wins = val1 > val2;
                const p2Wins = val2 > val1;

                return (
                  <div key={attr.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${p1Wins ? 'text-pitch-400' : 'text-slate-300'}`}>
                        {val1}
                      </span>
                      <span className="font-display uppercase text-slate-400 tracking-wider">
                        {attr.label}
                      </span>
                      <span className={`font-bold ${p2Wins ? 'text-pitch-400' : 'text-slate-300'}`}>
                        {val2}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Player 1 bar (fills left to right) */}
                      <div className="w-full bg-stadium-900 h-2 rounded-full overflow-hidden flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p1Wins ? 'bg-pitch-500 shadow-pitch-glow' : 'bg-gold-500/60'
                          }`}
                          style={{ width: `${Math.min(100, (val1 / 120) * 100)}%` }}
                        />
                      </div>
                      {/* Player 2 bar (fills left to right) */}
                      <div className="w-full bg-stadium-900 h-2 rounded-full overflow-hidden flex justify-start">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p2Wins ? 'bg-pitch-500 shadow-pitch-glow' : 'bg-cyan-500/60'
                          }`}
                          style={{ width: `${Math.min(100, (val2 / 120) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Career Stats Comparison */}
          <div className="bg-stadium-950/60 p-5 rounded-2xl border border-white/5 space-y-3">
            <h4 className="font-display font-bold text-sm uppercase text-slate-200 border-b border-stadium-800 pb-2">
              INTERNATIONAL {selectedFormat.toUpperCase()} CAREER COMPARISON
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-stadium-800 text-[10px] uppercase">
                    <th className="py-2 text-left">{player1.shortName}</th>
                    <th className="py-2">Metric</th>
                    <th className="py-2 text-right">{player2.shortName}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stadium-800 text-[11px]">
                  <tr>
                    <td className="py-2 text-left font-bold text-white">
                      {player1.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.matches || '0'}
                    </td>
                    <td className="py-2 text-slate-400">Matches</td>
                    <td className="py-2 text-right font-bold text-white">
                      {player2.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.matches || '0'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-left font-bold text-gold-400">
                      {player1.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.runs || '0'}
                    </td>
                    <td className="py-2 text-slate-400">Runs</td>
                    <td className="py-2 text-right font-bold text-gold-400">
                      {player2.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.runs || '0'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-left font-bold text-pitch-400">
                      {player1.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.average || '0'}
                    </td>
                    <td className="py-2 text-slate-400">Batting Average</td>
                    <td className="py-2 text-right font-bold text-pitch-400">
                      {player2.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.average || '0'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-left font-bold text-cyan-400">
                      {player1.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.wickets || '0'}
                    </td>
                    <td className="py-2 text-slate-400">Wickets</td>
                    <td className="py-2 text-right font-bold text-cyan-400">
                      {player2.internationalStats?.[selectedFormat === 't20' ? 't20i' : selectedFormat]?.wickets || '0'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
