import React from 'react';
import { Award } from 'lucide-react';

export default function BowlingFigures({ bowlingFigures = [] }) {
  const data = bowlingFigures && bowlingFigures.length > 0 ? bowlingFigures : [
    {
      name: 'Jasprit Bumrah',
      ovr: 118,
      overs: '4.0',
      maidens: 1,
      runs: 24,
      wickets: 2,
      dots: 14,
      economy: 6.0,
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg'
    },
    {
      name: 'Mohammed Siraj',
      ovr: 108,
      overs: '4.0',
      maidens: 0,
      runs: 38,
      wickets: 1,
      dots: 9,
      economy: 9.5,
      photoUrl: null
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Bowling Figures
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                O-M-R-W
              </span>
            </h3>
            <p className="text-xs text-slate-400">Detailed bowling spells, maidens, economy and dot balls</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="pb-2.5 font-semibold">Bowler</th>
              <th className="pb-2.5 font-semibold text-center">O</th>
              <th className="pb-2.5 font-semibold text-center">M</th>
              <th className="pb-2.5 font-semibold text-center">R</th>
              <th className="pb-2.5 font-semibold text-center">W</th>
              <th className="pb-2.5 font-semibold text-center">Dots</th>
              <th className="pb-2.5 font-semibold text-right">Econ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((b, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {b.photoUrl ? (
                      <img src={b.photoUrl} alt={b.name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {b.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{b.name}</div>
                    <div className="text-[10px] text-amber-400 font-mono">{b.ovr || 100} OVR</div>
                  </div>
                </td>
                <td className="py-2.5 text-center font-mono text-slate-300">{b.overs}</td>
                <td className="py-2.5 text-center font-mono text-slate-400">{b.maidens || 0}</td>
                <td className="py-2.5 text-center font-mono text-slate-200 font-semibold">{b.runs}</td>
                <td className="py-2.5 text-center font-mono font-bold text-red-400">{b.wickets}</td>
                <td className="py-2.5 text-center font-mono text-slate-400">{b.dots || 0}</td>
                <td className="py-2.5 text-right font-mono font-bold text-emerald-400">{b.economy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

