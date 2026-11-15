import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BarChart2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-700 px-3 py-2 rounded-xl shadow-xl text-xs backdrop-blur-md">
        <p className="font-bold text-white mb-1">Over {data.over}</p>
        <p className="text-emerald-400 font-semibold">{data.runs} Runs scored</p>
        {data.wickets > 0 && (
          <p className="text-red-400 font-semibold mt-0.5">
            {data.wickets} Wicket{data.wickets > 1 ? 's' : ''} fell!
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ManhattanChart({ data = [], title = 'Manhattan Chart' }) {
  // Safe default fallback if empty
  const chartData = data && data.length > 0 ? data : [
    { over: 1, runs: 6, wickets: 0 },
    { over: 2, runs: 12, wickets: 1 },
    { over: 3, runs: 4, wickets: 0 },
    { over: 4, runs: 15, wickets: 0 },
    { over: 5, runs: 8, wickets: 0 },
    { over: 6, runs: 18, wickets: 1 }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                Runs / Over
              </span>
            </h3>
            <p className="text-xs text-slate-400">Over-by-over run production and wickets</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
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
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="runs" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.wickets > 0 ? '#EF4444' : entry.runs >= 12 ? '#10B981' : '#3B82F6'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
          <span className="text-slate-300">Normal Over</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
          <span className="text-slate-300">Big Over (&ge;12)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
          <span className="text-slate-300">Wicket Over</span>
        </div>
      </div>
    </div>
  );
}

