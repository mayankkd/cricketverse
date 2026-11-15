import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Shield, Flame, AlertCircle, Clock, Wind } from 'lucide-react';

export const BOWLER_ROLES = [
  { id: 'Opening bowlers', name: 'Opening bowlers', desc: 'Exploit fresh seam, new ball swing, and early powerplay wickets' },
  { id: 'First-change bowlers', name: 'First-change bowlers', desc: 'Sustained pressure after opening spell, tight line and length' },
  { id: 'Middle-over specialists', name: 'Middle-over specialists', desc: 'Spin and deception, choking singles and inducing mistimed lofts' },
  { id: 'Death-over specialists', name: 'Death-over specialists', desc: 'Pinpoint yorkers, disguised slower balls, boundary containment' }
];

export const DELIVERY_TACTICS = [
  { id: 'Yorker', name: 'Yorker', desc: 'Toe-crushing base of stumps, suppresses 4s/6s, high bowled/lbw threat' },
  { id: 'Bouncer', name: 'Bouncer', desc: 'Hostile short pitch delivery, induces top-edge catches in deep' },
  { id: 'Swing', name: 'Swing', desc: 'Late movement in the air, edges carried to Slips & Wicketkeeper' },
  { id: 'Seam', name: 'Seam', desc: 'Deviation off the deck, hits top of off stump' },
  { id: 'Slower ball', name: 'Slower ball', desc: 'Knuckle/Back of hand deception, induces mistimed aerial catches' },
  { id: 'Off-spin', name: 'Off-spin', desc: 'Turns into right-handers, bat-pad and stumping opportunities' },
  { id: 'Leg-spin', name: 'Leg-spin', desc: 'Drift and sharp turn away, outside edge to slips and stumpings' }
];

export const BowlingStrategyPanel = ({
  bowlingTactics = {},
  onChange,
  playingXI = [],
  format = 'T20',
  isReadOnly = false
}) => {
  const assignments = bowlingTactics.bowlerAssignments || [];
  const plannedPhases = bowlingTactics.plannedPhases || {};

  const fmt = (format || 'T20').toUpperCase();
  const maxFormatOvers = fmt === 'TEST' ? 99 : (fmt === 'ODI' ? 10 : 4);

  const handleRoleChange = (playerId, newRole) => {
    if (isReadOnly) return;
    const updated = assignments.map(a => {
      if (a.playerId === playerId) {
        return { ...a, role: newRole };
      }
      return a;
    });

    if (onChange) {
      onChange({
        ...bowlingTactics,
        bowlerAssignments: updated
      });
    }
  };

  const handleTacticChange = (playerId, newTactic) => {
    if (isReadOnly) return;
    const updated = assignments.map(a => {
      if (a.playerId === playerId) {
        return { ...a, deliveryTactic: newTactic };
      }
      return a;
    });

    if (onChange) {
      onChange({
        ...bowlingTactics,
        bowlerAssignments: updated
      });
    }
  };

  const handleOversChange = (playerId, newOvers) => {
    if (isReadOnly) return;
    const oversNum = Number(newOvers);
    const updated = assignments.map(a => {
      if (a.playerId === playerId) {
        return { ...a, oversAllocated: oversNum };
      }
      return a;
    });

    if (onChange) {
      onChange({
        ...bowlingTactics,
        bowlerAssignments: updated
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Format Bowling Restriction Notice */}
      <div className="p-4 rounded-2xl bg-stadium-950 border border-pitch-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-pitch-300">
          <Clock className="w-4 h-4 text-pitch-400" />
          <span>
            FORMAT RESTRICTION ({fmt}): <strong>{fmt === 'TEST' ? 'Unlimited Overs' : `${maxFormatOvers} Overs Max per Bowler`}</strong>
          </span>
        </div>
        <span className="text-slate-400">
          {assignments.length} Primary Bowlers Assigned
        </span>
      </div>

      {/* Bowler Assignments Table */}
      <div className="bg-stadium-950 border border-stadium-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stadium-800">
          <h4 className="font-display text-sm font-bold uppercase text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-gold-400" />
            BOWLER ROLES & DELIVERY VARIATION TACTICS
          </h4>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
            PHASE SPECIALIZATIONS
          </span>
        </div>

        <div className="space-y-3">
          {assignments.map((bowler, idx) => {
            const player = playingXI.find(p => p._id === bowler.playerId || p.playerId === bowler.playerId) || {
              name: bowler.playerName || `Bowler #${idx + 1}`,
              role: 'Bowler',
              ovr: 88,
              countryFlag: '🏏'
            };

            const isOverLimit = bowler.oversAllocated > maxFormatOvers;

            return (
              <div
                key={bowler.playerId || idx}
                className={`bg-stadium-900 border rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                  isOverLimit ? 'border-red-500/60 bg-red-950/20' : 'border-white/5 hover:border-gold-500/30'
                }`}
              >
                {/* Bowler Details */}
                <div className="flex items-center gap-3 min-w-[210px]">
                  <span className="w-6 h-6 rounded-lg bg-pitch-950 border border-pitch-600/40 font-mono font-bold text-xs text-pitch-400 flex items-center justify-center flex-shrink-0">
                    B{idx + 1}
                  </span>

                  {player.imageUrl && (
                    <img
                      src={player.imageUrl}
                      alt={player.name}
                      className="w-10 h-10 rounded-xl object-cover object-top border border-white/10 flex-shrink-0"
                    />
                  )}

                  <div>
                    <h5 className="font-display font-bold text-sm text-white truncate max-w-[150px]">
                      {player.name}
                    </h5>
                    <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span>{player.countryFlag}</span>
                      <span>{player.bowlingStyle || player.role}</span>
                    </p>
                  </div>
                </div>

                {/* Bowler Role / Phase */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold min-w-[50px]">
                    PHASE:
                  </span>
                  <select
                    disabled={isReadOnly}
                    value={bowler.role || 'Middle-over specialists'}
                    onChange={(e) => handleRoleChange(bowler.playerId, e.target.value)}
                    className="bg-stadium-950 border border-stadium-700 text-white font-mono text-xs rounded-xl px-3 py-1.5 focus:border-gold-400 outline-none disabled:opacity-50"
                  >
                    {BOWLER_ROLES.map(r => (
                      <option key={r.id} value={r.id} className="bg-stadium-950 text-white">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Tactic Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold min-w-[55px]">
                    TACTIC:
                  </span>
                  <select
                    disabled={isReadOnly}
                    value={bowler.deliveryTactic || 'Seam'}
                    onChange={(e) => handleTacticChange(bowler.playerId, e.target.value)}
                    className="bg-stadium-950 border border-stadium-700 text-gold-400 font-mono text-xs font-bold rounded-xl px-3 py-1.5 focus:border-gold-400 outline-none disabled:opacity-50"
                  >
                    {DELIVERY_TACTICS.map(t => (
                      <option key={t.id} value={t.id} className="bg-stadium-950 text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Allocated Overs with Format Validation */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold min-w-[45px]">
                    OVERS:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={maxFormatOvers}
                    disabled={isReadOnly}
                    value={bowler.oversAllocated || 4}
                    onChange={(e) => handleOversChange(bowler.playerId, e.target.value)}
                    className={`w-14 bg-stadium-950 border text-center font-mono font-bold text-xs rounded-xl px-2 py-1 outline-none disabled:opacity-50 ${
                      isOverLimit ? 'border-red-500 text-red-400' : 'border-stadium-700 text-white focus:border-gold-400'
                    }`}
                  />
                  <span className="text-xs font-mono text-slate-500">
                    / {maxFormatOvers}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

