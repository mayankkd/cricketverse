import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

const CustomRRTooltip = ({ active, payload, label }) => {
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
              {entry.value} rpo
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RunRateGraph({ wormData = [], targetScore = null, maxOvers = 20 }) {
  // Compute CRR and RRR per over
  const chartData = (wormData && wormData.length > 0 ? wormData : []).map(w => {
    const ov = Math.max(0.1, w.over);
    const crr = Number(((w.teamBScore || w.teamAScore || 0) / ov).toFixed(2));
    const rrr = targetScore ? Number((Math.max(0, targetScore - (w.teamBScore || 0)) / Math.max(0.1, (maxOvers - ov))).toFixed(2)) : 0;
    return {
      over: w.over,
      crr,
      rrr
    };
  });

  const displayData = chartData.length > 0 ? chartData : [
    { over: 1, crr: 6.0, rrr: 9.8 },
    { over: 5, crr: 7.6, rrr: 10.2 },
    { over: 10, crr: 8.8, rrr: 9.4 },
    { over: 15, crr: 9.6, rrr: 8.6 },
    { over: 20, crr: 10.1, rrr: 0.0 }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Run Rate Progression
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                CRR vs RRR
              </span>
            </h3>
            <p className="text-xs text-slate-400">Current run rate compared with required chase rate</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
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
            <Tooltip content={<CustomRRTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
            />
            <Line
              type="monotone"
              dataKey="crr"
              name="Current Run Rate (CRR)"
              stroke="#06B6D4"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#06B6D4' }}
              activeDot={{ r: 5 }}
            />
            {targetScore && (
              <Line
                type="monotone"
                dataKey="rrr"
                name="Required Run Rate (RRR)"
                stroke="#F43F5E"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#F43F5E' }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <span>Runs per over tempo</span>
        <span>Pressure line tracking</span>
      </div>
    </div>
  );
}

