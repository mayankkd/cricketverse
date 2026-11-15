import React from 'react';
import { Trophy, Star, Flame, Zap } from 'lucide-react';

export default function MatchSummaryCard({ matchSummary = {}, match = {} }) {
  const summary = matchSummary || {
    title: match.title || 'Multiplayer Championship Final',
    venue: match.venue || 'Eden Gardens, Kolkata',
    format: match.format || 'T20',
    result: match.result || 'Match In Progress',
    playerOfTheMatch: {
      name: 'Virat Kohli',
      role: 'Top-Order Batter',
      stats: '82 runs (45b, 7x4, 3x6)',
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg'
    },
    topBatter: {
      name: 'Virat Kohli',
      runs: 82,
      balls: 45,
      fours: 7,
      sixes: 3
    },
    topBowler: {
      name: 'Jasprit Bumrah',
      overs: '4.0',
      runs: 24,
      wickets: 2,
      economy: 6.0
    },
    decisivePhase: 'Sensational death overs counter-attack swung the match momentum decisively.'
  };

  const potm = summary.playerOfTheMatch || {
    name: 'Player of the Match',
    role: 'Match Winner',
    stats: 'Decisive Performance'
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative Gold Glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-slate-950 font-bold shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
              Official Match Summary • {summary.format || 'T20'}
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-wide">
              {summary.result || 'Match in Progress'}
            </h2>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400 hidden sm:block">
          <div className="font-semibold text-slate-300">{summary.venue || 'Stadium'}</div>
          <div>{summary.title || 'CricketVerse Championship'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Player of the Match Card */}
        <div className="md:col-span-1 bg-gradient-to-b from-amber-500/10 to-slate-800/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            <Star className="w-3 h-3 fill-amber-400" /> POTM
          </div>

          <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-amber-400 overflow-hidden shadow-xl mt-4 mb-3 flex-shrink-0">
            {potm.photoUrl ? (
              <img src={potm.photoUrl} alt={potm.name} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold text-2xl">
                {potm.name[0]}
              </div>
            )}
          </div>

          <h3 className="text-base font-extrabold text-white">{potm.name}</h3>
          <span className="text-xs text-amber-400 font-medium">{potm.role || 'Key Performer'}</span>
          <div className="text-xs font-mono font-bold text-emerald-400 mt-2 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-700">
            {potm.stats}
          </div>
        </div>

        {/* Top Performers (Batter & Bowler) */}
        <div className="md:col-span-2 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Top Batter */}
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-cyan-400" /> Top Batter
              </div>
              <div className="text-sm font-bold text-white">
                {summary.topBatter?.name || 'Top Batter'}
              </div>
              <div className="font-mono text-emerald-400 text-base font-extrabold mt-1">
                {summary.topBatter?.runs || 0} <span className="text-xs font-normal text-slate-400">runs ({summary.topBatter?.balls || 0}b)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {summary.topBatter?.fours || 0}x4 • {summary.topBatter?.sixes || 0}x6
              </div>
            </div>

            {/* Top Bowler */}
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                <Zap className="w-4 h-4 text-purple-400" /> Top Bowler
              </div>
              <div className="text-sm font-bold text-white">
                {summary.topBowler?.name || 'Top Bowler'}
              </div>
              <div className="font-mono text-purple-400 text-base font-extrabold mt-1">
                {summary.topBowler?.wickets || 0} <span className="text-xs font-normal text-slate-400">wkts / {summary.topBowler?.runs || 0} runs</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {summary.topBowler?.overs || '4.0'} ov • Econ {summary.topBowler?.economy || 6.0}
              </div>
            </div>
          </div>

          {/* Decisive Phase Statement */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">
              Decisive Match Phase
            </span>
            <p className="text-slate-300 italic leading-relaxed">
              "{summary.decisivePhase || 'Crucial moments in the mid-innings determined the championship winner.'}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
