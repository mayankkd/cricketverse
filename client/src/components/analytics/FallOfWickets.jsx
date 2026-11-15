import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function FallOfWickets({ fallOfWickets = [] }) {
  const data = fallOfWickets && fallOfWickets.length > 0 ? fallOfWickets : [
    { wicketNumber: 1, score: 32, over: '3.4', batterName: 'Glenn Maxwell', dismissal: 'b Jasprit Bumrah', bowlerName: 'Jasprit Bumrah' },
    { wicketNumber: 2, score: 86, over: '9.2', batterName: 'Heinrich Klaasen', dismissal: 'c Rohit Sharma b Jasprit Bumrah', bowlerName: 'Jasprit Bumrah' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Fall of Wickets
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono">
                Dismissals
              </span>
            </h3>
            <p className="text-xs text-slate-400">Chronological timeline of dismissals and team score</p>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          No wickets have fallen yet in this innings.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2.5 font-semibold">Wkt</th>
                <th className="pb-2.5 font-semibold">Score</th>
                <th className="pb-2.5 font-semibold">Over</th>
                <th className="pb-2.5 font-semibold">Batter</th>
                <th className="pb-2.5 font-semibold">Dismissal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-mono font-bold text-red-400">
                    {f.wicketNumber}-{f.score}
                  </td>
                  <td className="py-2.5 font-mono font-bold text-white">
                    {f.score}
                  </td>
                  <td className="py-2.5 font-mono text-slate-400">
                    Ov {f.over}
                  </td>
                  <td className="py-2.5 font-semibold text-slate-200">
                    {f.batterName}
                  </td>
                  <td className="py-2.5 text-slate-400">
                    {f.dismissal || 'Dismissed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

