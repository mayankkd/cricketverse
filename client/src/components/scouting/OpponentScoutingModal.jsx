import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Target,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCw,
  Flame,
  TrendingDown
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';

export const OpponentScoutingModal = ({ teamId, opponentId, isOpen, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && teamId && opponentId) {
      setLoading(true);
      api.getOpponentScouting(teamId, opponentId)
        .then(res => {
          if (res.success && res.scoutingReport) {
            setReport(res.scoutingReport);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, teamId, opponentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-stadium-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase">
            ANALYTICAL SCOUTING DECK • PHASE 12
          </span>
          <h2 className="font-display font-black text-2xl text-white uppercase mt-1">
            OPPONENT SCOUTING & TACTICAL DOSSIER
          </h2>
          <p className="text-xs font-mono text-slate-400">
            TARGET: <strong className="text-cyan-400">{report?.targetTeamName || 'Opponent Franchise'}</strong> ({report?.shortCode || 'OPP'})
          </p>
        </div>

        {loading || !report ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-cyan-400 font-mono text-xs">
            <RotateCw className="w-6 h-6 animate-spin" />
            <span>EXTRACTING OPPONENT TELEMETRY & MATCHUP WEAKNESSES...</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Scouting Summary */}
            <div className="p-4 bg-stadium-950 rounded-2xl border border-white/5 text-xs font-mono text-slate-300">
              <strong>Chief Scout Executive Summary:</strong> {report.scoutingSummary}
            </div>

            {/* Batting & Bowling Analysis Dual Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Batting Breakdown */}
              <div className="p-4 bg-stadium-950 rounded-2xl border border-amber-500/30 space-y-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                  Batting Threat Profile
                </span>
                <p className="text-xs font-mono text-slate-200">
                  Powerplay Strike Rate: <strong className="text-amber-400">{report.battingAnalysis?.powerplayStrikeRate}</strong>
                </p>
                <p className="text-xs font-mono text-slate-300">
                  <strong>Weakness:</strong> {report.battingAnalysis?.weaknessAgainstSpin}
                </p>
                <p className="text-xs font-mono text-slate-400">
                  Hotspot: {report.battingAnalysis?.preferredBoundaryZone}
                </p>
              </div>

              {/* Bowling Breakdown */}
              <div className="p-4 bg-stadium-950 rounded-2xl border border-cyan-500/30 space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
                  Bowling Vulnerability
                </span>
                <p className="text-xs font-mono text-slate-200">
                  Death Over Economy: <strong className="text-cyan-400">{report.bowlingAnalysis?.deathOverEconomy} rpo</strong>
                </p>
                <p className="text-xs font-mono text-slate-300">
                  <strong>Pace Attack:</strong> {report.bowlingAnalysis?.paceStrength}
                </p>
                <p className="text-xs font-mono text-slate-400">
                  Leak Zone: {report.bowlingAnalysis?.vulnerability}
                </p>
              </div>
            </div>

            {/* Recommended Tactical Counter-Measures */}
            <div className="space-y-2">
              <h3 className="font-display font-black text-sm uppercase text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-gold-400" /> RECOMMENDED TACTICAL COUNTER-MEASURES
              </h3>

              <div className="space-y-2">
                {(report.recommendedTactics || []).map((tactic, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stadium-950 rounded-xl border border-white/5 flex items-start gap-2.5 text-xs font-mono text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-md bg-gold-500 text-slate-950 font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <span>{tactic}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                sound.playGavelStrike();
                alert('Tactical instructions dispatched to captain & coaching staff!');
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-display font-black uppercase text-xs shadow-lg transition-transform active:scale-95"
            >
              LOCK TACTICAL MATCHUP INSTRUCTIONS
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

