import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { X, ArrowRightLeft, ShieldCheck, Zap } from 'lucide-react';
import api from '../../services/api';

export default function PlayerComparisonModal({ isOpen, onClose, matchId, playerList = [] }) {
  const [player1Id, setPlayer1Id] = useState(playerList[0]?._id || 'ply_01');
  const [player2Id, setPlayer2Id] = useState(playerList[1]?._id || 'ply_02');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const res = await api.compareMatchPlayers(matchId || 'LIVE-IPL-FINAL', player1Id, player2Id);
        if (res.success && res.comparison) {
          setComparison(res.comparison);
        }
      } catch (err) {
        console.error('Player comparison error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [isOpen, matchId, player1Id, player2Id]);

  if (!isOpen) return null;

  const pA = comparison?.playerA || {
    name: 'Virat Kohli',
    country: 'India',
    ovr: 115,
    role: 'Top-Order Batter',
    batting: 118,
    bowling: 42,
    fielding: 95,
    fitness: 98,
    power: 96,
    timing: 119,
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg'
  };

  const pB = comparison?.playerB || {
    name: 'Jasprit Bumrah',
    country: 'India',
    ovr: 118,
    role: 'Pace Bowler',
    batting: 38,
    bowling: 120,
    fielding: 88,
    fitness: 96,
    power: 84,
    timing: 65,
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg'
  };

  const radarData = comparison?.radarMetrics || [
    { metric: 'OVR', valA: 115, valB: 118 },
    { metric: 'Batting', valA: 118, valB: 38 },
    { metric: 'Bowling', valA: 42, valB: 120 },
    { metric: 'Fielding', valA: 95, valB: 88 },
    { metric: 'Fitness', valA: 98, valB: 96 },
    { metric: 'Power', valA: 96, valB: 84 },
    { metric: 'Timing', valA: 119, valB: 65 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Head-to-Head Player Comparison</h2>
              <p className="text-xs text-slate-400">Side-by-side attributes radar and skill metrics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Profile Cards */}
        <div className="grid grid-cols-2 gap-4 my-4">
          {/* Player A Card */}
          <div className="bg-slate-800/60 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-cyan-400 overflow-hidden flex-shrink-0 shadow-md">
              {pA.photoUrl ? (
                <img src={pA.photoUrl} alt={pA.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold text-lg">
                  {pA.name[0]}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base leading-tight">{pA.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                  {pA.ovr} OVR
                </span>
              </div>
              <div className="text-xs text-cyan-400 font-medium mt-0.5">{pA.role}</div>
              <div className="text-[11px] text-slate-400">{pA.country}</div>
            </div>
          </div>

          {/* Player B Card */}
          <div className="bg-slate-800/60 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-purple-400 overflow-hidden flex-shrink-0 shadow-md">
              {pB.photoUrl ? (
                <img src={pB.photoUrl} alt={pB.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-400 font-bold text-lg">
                  {pB.name[0]}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base leading-tight">{pB.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                  {pB.ovr} OVR
                </span>
              </div>
              <div className="text-xs text-purple-400 font-medium mt-0.5">{pB.role}</div>
              <div className="text-[11px] text-slate-400">{pB.country}</div>
            </div>
          </div>
        </div>

        {/* 7-Axis Comparative Radar Chart */}
        <div className="h-64 w-full my-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" stroke="#94A3B8" fontSize={11} fontWeight="bold" />
              <PolarRadiusAxis angle={30} domain={[0, 120]} stroke="#475569" fontSize={9} />
              <Radar
                name={pA.name}
                dataKey="valA"
                stroke="#06B6D4"
                fill="#06B6D4"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Radar
                name={pB.name}
                dataKey="valB"
                stroke="#A855F7"
                fill="#A855F7"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-950/95 border border-slate-700 px-3 py-2 rounded-xl text-xs backdrop-blur-md">
                        <div className="font-bold text-white mb-1">{payload[0]?.payload?.metric}</div>
                        <div className="text-cyan-400">{pA.name}: <span className="font-mono font-bold">{payload[0]?.value}</span></div>
                        <div className="text-purple-400">{pB.name}: <span className="font-mono font-bold">{payload[1]?.value}</span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Attribute Metric Comparison Bars */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase">Batting Skill</span>
            <div className="flex justify-between font-mono font-bold mt-1">
              <span className="text-cyan-400">{pA.batting}</span>
              <span className="text-slate-600">vs</span>
              <span className="text-purple-400">{pB.batting}</span>
            </div>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase">Bowling Skill</span>
            <div className="flex justify-between font-mono font-bold mt-1">
              <span className="text-cyan-400">{pA.bowling}</span>
              <span className="text-slate-600">vs</span>
              <span className="text-purple-400">{pB.bowling}</span>
            </div>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase">Fitness / Power</span>
            <div className="flex justify-between font-mono font-bold mt-1">
              <span className="text-cyan-400">{pA.fitness}</span>
              <span className="text-slate-600">vs</span>
              <span className="text-purple-400">{pB.fitness}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

