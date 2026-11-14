import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  Calendar,
  Shield,
  Radio,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { sound } from '../services/sound';

export const TournamentDashboard = () => {
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('table'); // 'table', 'playoffs', 'fixtures'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.getTournaments();
        if (res.success && res.tournaments && res.tournaments[0]) {
          setTournament(res.tournaments[0]);
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading || !tournament) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gold-400 font-mono text-sm">
        LOADING CHAMPIONSHIP BRACKETS...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Tournament Banner */}
      <div className="bg-stadium-900 border border-gold-500/30 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase">
              {tournament.edition} • {tournament.format}
            </span>
            <span className="text-xs font-mono text-pitch-400 font-bold">
              GROUP STAGE ACTIVE
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            {tournament.name}
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Championship Prize Pool: <strong className="text-gold-400">₹{(tournament.prizePool / 10000000).toFixed(0)} Crores</strong> • Top 4 advance to Playoffs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-stadium-950 p-1.5 rounded-2xl border border-stadium-800 self-start md:self-auto">
          {[
            { id: 'table', label: 'Points Table' },
            { id: 'playoffs', label: 'Playoff Tree' },
            { id: 'fixtures', label: 'Fixtures' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-display uppercase font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* View: Points Table */}
      {activeTab === 'table' && (
        <div className="bg-stadium-900 border border-stadium-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6 border-b border-stadium-800 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase text-white">
                OFFICIAL LEAGUE STANDINGS
              </h2>
              <p className="text-xs font-mono text-slate-400">
                TOP 4 QUALIFY FOR QUALIFIER 1 & ELIMINATOR
              </p>
            </div>
            <span className="text-[11px] font-mono text-pitch-400 font-bold">
              ● GREEN BORDER = PLAYOFF ZONE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-stadium-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-stadium-800">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Franchise</th>
                  <th className="py-3 px-3 text-center">P</th>
                  <th className="py-3 px-3 text-center">W</th>
                  <th className="py-3 px-3 text-center">L</th>
                  <th className="py-3 px-3 text-center">T</th>
                  <th className="py-3 px-4 text-center">NRR</th>
                  <th className="py-3 px-4 text-center">Recent Form</th>
                  <th className="py-3 px-4 text-center text-gold-400 font-bold">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stadium-800">
                {tournament.standings?.map((team, idx) => {
                  const isTop4 = idx < 4;
                  return (
                    <tr
                      key={team.teamName}
                      className={`hover:bg-stadium-850/60 transition-colors ${
                        isTop4 ? 'bg-stadium-900/60 border-l-4 border-l-pitch-500' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-bold text-slate-300">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4 font-sans font-bold text-white flex items-center gap-2">
                        <span className="font-display font-black text-xs text-gold-400">
                          {team.shortCode}
                        </span>
                        <span>{team.teamName}</span>
                      </td>
                      <td className="py-4 px-3 text-center text-slate-300">{team.played}</td>
                      <td className="py-4 px-3 text-center text-pitch-400 font-bold">{team.won}</td>
                      <td className="py-4 px-3 text-center text-red-400">{team.lost}</td>
                      <td className="py-4 px-3 text-center text-slate-400">{team.tied}</td>
                      <td className="py-4 px-4 text-center font-bold text-slate-200">
                        {team.nrr > 0 ? `+${team.nrr}` : team.nrr}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {team.form?.map((result, i) => (
                            <span
                              key={i}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                                result === 'W' ? 'bg-pitch-600 text-white' : 'bg-red-600 text-white'
                              }`}
                            >
                              {result}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-display font-black text-base text-gold-400">
                        {team.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: Playoff Bracket Tree */}
      {activeTab === 'playoffs' && (
        <div className="bg-stadium-900 border border-stadium-800 p-8 rounded-3xl shadow-xl">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-black uppercase text-white">
              PLAYOFF KNOCKOUT ROADMAP
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              IPL 4-TEAM QUALIFIER SYSTEM
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Qualifier 1 & Eliminator */}
            <div className="space-y-6">
              <div className="bg-stadium-950 border border-gold-500/40 p-5 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-gold-400 uppercase block mb-1">
                  QUALIFIER 1 (RANK 1 VS RANK 2)
                </span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.qualifier1?.team1}
                </p>
                <span className="text-xs text-slate-500 font-mono">VS</span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.qualifier1?.team2}
                </p>
                <span className="text-[10px] font-mono text-pitch-400 block mt-2">
                  Winner advances to Grand Final
                </span>
              </div>

              <div className="bg-stadium-950 border border-stadium-800 p-5 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  ELIMINATOR (RANK 3 VS RANK 4)
                </span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.eliminator?.team1}
                </p>
                <span className="text-xs text-slate-500 font-mono">VS</span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.eliminator?.team2}
                </p>
                <span className="text-[10px] font-mono text-red-400 block mt-2">
                  Loser eliminated from tournament
                </span>
              </div>
            </div>

            {/* Qualifier 2 */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full bg-stadium-950 border border-electric-500/40 p-5 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-electric-400 uppercase block mb-1">
                  QUALIFIER 2
                </span>
                <p className="font-display font-bold text-sm text-white">Loser Qualifier 1</p>
                <span className="text-xs text-slate-500 font-mono">VS</span>
                <p className="font-display font-bold text-sm text-white">Winner Eliminator</p>
                <span className="text-[10px] font-mono text-gold-400 block mt-2">
                  Winner advances to Final
                </span>
              </div>
            </div>

            {/* Grand Final Trophy Stage */}
            <div className="bg-gradient-to-b from-stadium-950 to-amber-950/40 border-2 border-gold-400 p-6 rounded-3xl text-center shadow-gold-glow">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-4xl mx-auto mb-3">
                🏆
              </div>
              <span className="text-[10px] font-mono font-bold text-gold-400 uppercase block">
                GRAND FINAL ARENA
              </span>
              <h3 className="font-display text-xl font-black uppercase text-white mt-1">
                CRICKETVERSE TROPHY 2026
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-2">
                Winner Q1 vs Winner Q2
              </p>
              <div className="mt-4 p-2 bg-stadium-900 rounded-xl text-gold-400 font-display font-bold text-xs uppercase">
                Prize: ₹50.00 Crores
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View: Fixtures */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {tournament.fixtures?.map((fix) => (
            <div
              key={fix.id}
              className="bg-stadium-900 border border-stadium-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-stadium-950 border border-white/5 flex items-center justify-center font-display font-black text-sm text-gold-400">
                  M{fix.matchNo}
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold uppercase text-white">
                    {fix.team1} vs {fix.team2}
                  </h4>
                  <p className="text-xs font-mono text-slate-400">
                    {fix.venue} • {fix.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full ${
                  fix.status === 'live' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-stadium-950 text-slate-400'
                }`}>
                  {fix.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

