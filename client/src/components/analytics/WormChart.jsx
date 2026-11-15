import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomWormTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-slate-700 px-3.5 py-2.5 rounded-xl shadow-xl text-xs backdrop-blur-md">
        <p className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">Over {label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {entry.value} runs
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function WormChart({
  wormData = [],
  teamAName = 'Team A',
  teamBName = 'Team B',
  targetScore = null
}) {
  const chartData = wormData && wormData.length > 0 ? wormData : [
    { over: 0, teamAScore: 0, teamBScore: 0 },
    { over: 5, teamAScore: 42, teamBScore: 38 },
    { over: 10, teamAScore: 88, teamBScore: 82 },
    { over: 15, teamAScore: 135, teamBScore: 140 },
    { over: 20, teamAScore: 192, teamBScore: 188 }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Worm Comparison
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                Cumulative
              </span>
            </h3>
            <p className="text-xs text-slate-400">Head-to-head innings trajectories</p>
          </div>
        </div>

        {targetScore && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{targetScore}</span>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="over"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `Ov ${v}`}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip content={<CustomWormTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
            />
            {targetScore && (
              <ReferenceLine
                y={targetScore}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{ value: `Target: ${targetScore}`, fill: '#F59E0B', fontSize: 10, position: 'insideTopLeft' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="teamAScore"
              name={teamAName}
              stroke="#DC2626"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#DC2626' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="teamBScore"
              name={teamBName}
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2563EB' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <span>Innings Progress</span>
        <span>Comparison of Team Run Rates</span>
      </div>
    </div>
  );
}
