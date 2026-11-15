import React from 'react';
import { Users2 } from 'lucide-react';

export default function PartnershipGraph({ partnerships = [] }) {
  const data = partnerships && partnerships.length > 0 ? partnerships : [
    {
      wicketNumber: 1,
      batter1: { name: 'Virat Kohli', runs: 34, balls: 22 },
      batter2: { name: 'Glenn Maxwell', runs: 48, balls: 26 },
      totalRuns: 82,
      totalBalls: 48,
      active: false
    },
    {
      wicketNumber: 2,
      batter1: { name: 'Virat Kohli', runs: 28, balls: 18 },
      batter2: { name: 'Heinrich Klaasen', runs: 36, balls: 19 },
      totalRuns: 64,
      totalBalls: 37,
      active: true
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Partnerships
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Pair Contributions
              </span>
            </h3>
            <p className="text-xs text-slate-400">Batting stands and partnership run splits</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((p, idx) => {
          const total = Math.max(1, p.totalRuns);
          const pct1 = Math.round(((p.batter1?.runs || 0) / total) * 100);
          const pct2 = 100 - pct1;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                p.active
                  ? 'bg-indigo-950/30 border-indigo-500/40 shadow-lg'
                  : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300">
                    {idx + 1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} Wicket
                  </span>
                  {p.active && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                <div className="font-mono text-white font-bold">
                  {p.totalRuns} runs <span className="text-slate-400 font-normal">({p.totalBalls || 0} balls)</span>
                </div>
              </div>

              {/* Names and Individual Stats */}
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-cyan-400 truncate max-w-[140px]">
                  {p.batter1?.name} <span className="text-slate-400 font-normal font-mono">({p.batter1?.runs || 0})</span>
                </span>
                <span className="text-purple-400 truncate max-w-[140px] text-right">
                  <span className="text-slate-400 font-normal font-mono">({p.batter2?.runs || 0})</span> {p.batter2?.name}
                </span>
              </div>

              {/* Split Bar */}
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${pct1}%` }}
                  className="h-full bg-cyan-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${pct2}%` }}
                  className="h-full bg-purple-500 transition-all duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>{pct1}%</span>
                <span>{pct2}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

