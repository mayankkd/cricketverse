import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  X,
  RotateCw,
  Award,
  Flame,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';

export const TeamChemistryModal = ({ teamId, isOpen, onClose }) => {
  const [chemistryData, setChemistryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && teamId) {
      setLoading(true);
      api.getTeamChemistry(teamId)
        .then(res => {
          if (res.success) {
            setChemistryData(res);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-stadium-900 border border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase">
            PHASE 12 CHEMISTRY ENGINE
          </span>
          <h2 className="font-display font-black text-2xl text-white uppercase mt-1">
            FRANCHISE SQUAD CHEMISTRY & SYNERGIES
          </h2>
          <p className="text-xs font-mono text-slate-400">
            BALANCED SYNERGY MULTIPLIERS FROM HISTORICAL PARTNERSHIPS, STYLES, TEAMS & COUNTRY
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-purple-400 font-mono text-xs">
            <RotateCw className="w-6 h-6 animate-spin" />
            <span>CALCULATING SQUAD SYNERGY MATRIX...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Chemistry Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-stadium-950 rounded-2xl border border-purple-500/30 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Overall Chemistry
                </span>
                <span className="font-display font-black text-3xl text-purple-400">
                  {chemistryData?.overallChemistry || 88} / 100
                </span>
                <span className="text-[9px] font-mono text-slate-500 block">Squad Harmony Index</span>
              </div>

              <div className="p-4 bg-stadium-950 rounded-2xl border border-gold-500/30 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Synergy Multiplier
                </span>
                <span className="font-display font-black text-3xl text-gold-400">
                  {chemistryData?.synergyMultiplier ? `+${((chemistryData.synergyMultiplier - 1) * 100).toFixed(1)}%` : '+4.2%'}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block">Balanced Output Boost</span>
              </div>

              <div className="p-4 bg-stadium-950 rounded-2xl border border-cyan-500/30 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Compatibility Score
                </span>
                <span className="font-display font-black text-3xl text-cyan-400">
                  {chemistryData?.compatibilityScore || 85}%
                </span>
                <span className="text-[9px] font-mono text-slate-500 block">Role Fit & Style Symmetry</span>
              </div>
            </div>

            {/* Active Historical Partnerships Section */}
            <div className="space-y-3">
              <h3 className="font-display font-black text-sm uppercase text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold-400" /> ACTIVE PARTNERSHIP SYNERGIES
              </h3>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(chemistryData?.activePartnerships && chemistryData.activePartnerships.length > 0) ? (
                  chemistryData.activePartnerships.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stadium-950 rounded-2xl border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🤝</span>
                        <div>
                          <p className="font-display font-bold text-xs text-white uppercase">
                            {p.player1} & {p.player2}
                          </p>
                          <p className="text-[10px] font-mono text-purple-300">
                            {p.synergyTitle}
                          </p>
                        </div>
                      </div>
                      <span className="font-display font-black text-xs text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-xl border border-gold-500/30">
                        {p.synergyMultiplier ? `+${((p.synergyMultiplier - 1) * 100).toFixed(1)}% SYNERGY` : '+5.0%'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-stadium-950 border border-white/5 text-slate-400 font-mono text-xs text-center">
                    Standard balanced synergy active across all squad combinations.
                  </div>
                )}
              </div>
            </div>

            {/* Chemistry Balancing Rules Pill */}
            <div className="p-3 rounded-2xl bg-stadium-950 border border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Fair Play Balance Clamp: Synergy capped strictly between 0.95x and 1.08x.</span>
              <span className="text-pitch-400 font-bold">BALANCED ✓</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
