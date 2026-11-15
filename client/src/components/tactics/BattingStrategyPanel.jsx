import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Shield, Target, Zap, Activity, Repeat, Sliders } from 'lucide-react';

export const BATTING_STRATEGIES = [
  {
    id: 'Aggressive',
    name: 'Aggressive',
    icon: Flame,
    color: 'from-amber-500 to-red-600',
    border: 'border-red-500/50',
    description: 'High tempo, aerial drives, and boundary hunting. Exploit powerplays and vacant zones (+25% boundaries, higher wicket risk).'
  },
  {
    id: 'Balanced',
    name: 'Balanced',
    icon: Target,
    color: 'from-blue-500 to-indigo-600',
    border: 'border-blue-500/50',
    description: 'Optimal equilibrium of strike rotation and loose delivery punishment. Ideal for steady progression.'
  },
  {
    id: 'Defensive',
    name: 'Defensive',
    icon: Shield,
    color: 'from-emerald-500 to-teal-700',
    border: 'border-emerald-500/50',
    description: 'Rock solid defense, leaving swinging balls outside off stump. Preserves wickets under hostile bowling spells (-40% wicket risk).'
  },
  {
    id: 'Anchor',
    name: 'Anchor',
    icon: Activity,
    color: 'from-cyan-500 to-blue-700',
    border: 'border-cyan-500/50',
    description: 'Innings stabilizer. Bats through 15+ overs, building partnerships and accelerating smoothly toward the climax.'
  },
  {
    id: 'Power Hitter',
    name: 'Power Hitter',
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
    border: 'border-purple-500/50',
    description: 'Maximum firepower. Stands and delivers towering sixes over long-on and deep midwicket (+35% sixes).'
  },
  {
    id: 'Rotating Strike',
    name: 'Rotating Strike',
    icon: Repeat,
    color: 'from-gold-500 to-amber-700',
    border: 'border-gold-500/50',
    description: 'Aggressive running between wickets. Drops balls into ring gaps for rapid singles and twos (-25% dot balls).'
  }
];

export const BattingStrategyPanel = ({
  battingTactics = {},
  onChange,
  playingXI = [],
  isReadOnly = false
}) => {
  const teamStrategy = battingTactics.teamStrategy || 'Balanced';
  const instructions = battingTactics.batterInstructions || [];

  const handleTeamStrategySelect = (stratId) => {
    if (isReadOnly) return;
    const updatedInstructions = instructions.map(instr => ({
      ...instr,
      strategy: stratId
    }));

    if (onChange) {
      onChange({
        ...battingTactics,
        teamStrategy: stratId,
        batterInstructions: updatedInstructions
      });
    }
  };

  const handleIndividualStrategyChange = (playerId, newStrategy) => {
    if (isReadOnly) return;
    const updated = instructions.map(instr => {
      if (instr.playerId === playerId) {
        return { ...instr, strategy: newStrategy };
      }
      return instr;
    });

    if (onChange) {
      onChange({
        ...battingTactics,
        batterInstructions: updated
      });
    }
  };

  const handleAggressionChange = (playerId, newAggression) => {
    if (isReadOnly) return;
    const updated = instructions.map(instr => {
      if (instr.playerId === playerId) {
        return { ...instr, aggressionLevel: Number(newAggression) };
      }
      return instr;
    });

    if (onChange) {
      onChange({
        ...battingTactics,
        batterInstructions: updated
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Team Strategy Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-gold-400" />
            <h3 className="font-display text-base font-bold uppercase text-white">
              GLOBAL TEAM BATTING TEMPO
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Active: <strong className="text-gold-400 uppercase">{teamStrategy}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BATTING_STRATEGIES.map(strat => {
            const Icon = strat.icon;
            const isSelected = teamStrategy === strat.id;

            return (
              <button
                key={strat.id}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleTeamStrategySelect(strat.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? `${strat.border} bg-stadium-900 shadow-gold-glow`
                    : 'border-stadium-800 bg-stadium-950 hover:bg-stadium-900/60 opacity-80 hover:opacity-100 disabled:opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${strat.color} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-display font-bold text-sm text-white uppercase">
                      {strat.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-gold-400 shadow-gold-glow" />
                  )}
                </div>
                <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
                  {strat.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Batter Tactical Instructions & Mid-Innings Changes */}
      <div className="bg-stadium-950 border border-stadium-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stadium-800">
          <div>
            <h4 className="font-display text-sm font-bold uppercase text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pitch-400" />
              INDIVIDUAL BATTER INSTRUCTIONS & MID-INNINGS ADJUSTMENTS
            </h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Customize aggression, role execution, and scoring intent per batter in the Playing XI
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-pitch-950 text-pitch-400 border border-pitch-500/30 px-2.5 py-1 rounded-full font-bold">
            11 BATTERS CONFIGURED
          </span>
        </div>

        <div className="space-y-3">
          {instructions.map((instr, idx) => {
            const player = playingXI.find(p => p._id === instr.playerId || p.playerId === instr.playerId) || {
              name: instr.playerName || `Batter #${idx + 1}`,
              role: 'Batter',
              ovr: 88,
              countryFlag: '🏏'
            };

            return (
              <div
                key={instr.playerId || idx}
                className="bg-stadium-900 border border-white/5 rounded-2xl p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-gold-500/30 transition-all"
              >
                {/* Batter Info */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <span className="w-6 h-6 rounded-lg bg-stadium-950 border border-stadium-700 font-mono font-bold text-xs text-gold-400 flex items-center justify-center flex-shrink-0">
                    {idx + 1}
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
                      <span>{player.role}</span>
                      <span className="text-gold-400 font-bold">OVR {player.ovr || 88}</span>
                    </p>
                  </div>
                </div>

                {/* Strategy Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold min-w-[65px]">
                    STRATEGY:
                  </span>
                  <select
                    disabled={isReadOnly}
                    value={instr.strategy || 'Balanced'}
                    onChange={(e) => handleIndividualStrategyChange(instr.playerId, e.target.value)}
                    className="bg-stadium-950 border border-stadium-700 text-white font-mono text-xs rounded-xl px-3 py-1.5 focus:border-gold-400 outline-none disabled:opacity-50"
                  >
                    {BATTING_STRATEGIES.map(s => (
                      <option key={s.id} value={s.id} className="bg-stadium-950 text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aggression Level Slider */}
                <div className="flex items-center gap-3 min-w-[190px]">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold min-w-[75px]">
                    AGGRESSION:
                  </span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    disabled={isReadOnly}
                    value={instr.aggressionLevel || 50}
                    onChange={(e) => handleAggressionChange(instr.playerId, e.target.value)}
                    className="w-24 accent-gold-500 cursor-pointer disabled:opacity-40"
                  />
                  <span className="font-mono text-xs font-bold text-gold-400 w-8 text-right">
                    {instr.aggressionLevel || 50}%
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
