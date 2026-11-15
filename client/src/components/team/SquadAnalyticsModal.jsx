import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Coins,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

export const SquadAnalyticsModal = ({
  isOpen,
  onClose,
  team = null,
  activeFormat = 't20'
}) => {
  if (!isOpen || !team) return null;

  // Radar chart data for team profile
  const radarData = [
    { attribute: 'Batting', value: team.battingStrength || 85, fullMark: 120 },
    { attribute: 'Bowling', value: team.bowlingStrength || 85, fullMark: 120 },
    { attribute: 'Fielding', value: team.fieldingStrength || 85, fullMark: 120 },
    { attribute: 'Fitness', value: team.fitnessAverage || 90, fullMark: 120 },
    { attribute: 'Chemistry', value: team.chemistryScore || 92, fullMark: 120 },
    { attribute: 'Overall', value: team.squadStrength || team.overallRating || 90, fullMark: 120 }
  ];

  // Role distribution bar data
  const balance = team.squadBalance || {};
  const roleData = [
    { role: 'Batters', count: balance.battersCount || 0, color: '#F59E0B' },
    { role: 'Bowlers', count: balance.bowlersCount || 0, color: '#06B6D4' },
    { role: 'All-Rounders', count: balance.allRoundersCount || 0, color: '#10B981' },
    { role: 'Wicketkeepers', count: balance.wicketKeepersCount || 0, color: '#8B5CF6' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-stadium-800 flex items-center justify-between bg-stadium-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-widest block">
                PERFORMANCE INTELLIGENCE
              </span>
              <h2 className="font-display text-2xl font-black uppercase text-white">
                SQUAD ANALYTICS & ATTRIBUTES
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
          {/* Key Metrics Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-stadium-950 p-4 rounded-2xl border border-gold-500/30">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                SQUAD STRENGTH
              </span>
              <span className="font-display font-black text-2xl text-gold-400">
                {team.squadStrength || team.overallRating || 90} <span className="text-xs font-mono font-normal text-slate-500">/ 120</span>
              </span>
            </div>

            <div className="bg-stadium-950 p-4 rounded-2xl border border-cyan-500/30">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                BATTING POWER
              </span>
              <span className="font-display font-black text-2xl text-cyan-400">
                {team.battingStrength || 85} <span className="text-xs font-mono font-normal text-slate-500">/ 120</span>
              </span>
            </div>

            <div className="bg-stadium-950 p-4 rounded-2xl border border-pitch-500/30">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                BOWLING ATTACK
              </span>
              <span className="font-display font-black text-2xl text-pitch-400">
                {team.bowlingStrength || 85} <span className="text-xs font-mono font-normal text-slate-500">/ 120</span>
              </span>
            </div>

            <div className="bg-stadium-950 p-4 rounded-2xl border border-purple-500/30">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                CHEMISTRY SYNERGY
              </span>
              <span className="font-display font-black text-2xl text-purple-400">
                {team.chemistryScore || 92} <span className="text-xs font-mono font-normal text-slate-500">/ 99</span>
              </span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Attributes Radar Chart */}
            <div className="bg-stadium-950 p-5 rounded-2xl border border-white/5 flex flex-col items-center">
              <span className="text-xs font-mono font-bold uppercase text-slate-300 self-start mb-2">
                1–120 Team Attribute Radar
              </span>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="attribute" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 120]} tick={{ fill: '#64748b', fontSize: 9 }} />
                    <Radar
                      name={team.name}
                      dataKey="value"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Role Distribution Chart */}
            <div className="bg-stadium-950 p-5 rounded-2xl border border-white/5 flex flex-col">
              <span className="text-xs font-mono font-bold uppercase text-slate-300 mb-2">
                Playing XI Role Distribution
              </span>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                    <XAxis dataKey="role" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Squad Balance Assessment Banner */}
          <div className="p-4 rounded-2xl bg-stadium-950 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {balance.isBalanced ? (
                <div className="w-9 h-9 rounded-xl bg-pitch-500/20 border border-pitch-500/40 text-pitch-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  TACTICAL SQUAD BALANCE
                </span>
                <p className="font-display font-bold text-sm text-white">
                  {balance.summary || 'Squad assembled with complete Playing XI'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">TOTAL SPENT</span>
              <span className="font-display font-black text-sm text-gold-400">
                {team.totalSpending || 0} Points
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
