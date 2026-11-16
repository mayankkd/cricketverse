import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Award,
  Calendar,
  Shield,
  Radio,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Play,
  RotateCw,
  Flame,
  CheckCircle2,
  Clock,
  Zap,
  Star,
  Users,
  Compass,
  Sliders,
  X,
  Swords,
  History,
  Target,
  Crown,
  Share2,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { sound } from '../services/sound';

export const TournamentDashboard = () => {
  const [tournament, setTournament] = useState(null);
  const [allTournaments, setAllTournaments] = useState([]);
  const [gameModes, setGameModes] = useState([]);
  const [selectedGameMode, setSelectedGameMode] = useState('auction_league');
  const [awards, setAwards] = useState(null);
  const [historicalChallenges, setHistoricalChallenges] = useState([]);
  const [rivalries, setRivalries] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState('table'); // 'table', 'awards', 'playoffs', 'fixtures', 'challenges'
  const [challengeSubTab, setChallengeSubTab] = useState('historical'); // 'historical', 'rivalries', 'scenarios'
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatingFixtureId, setSimulatingFixtureId] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState(null);

  // Custom Tournament Form State
  const [customForm, setCustomForm] = useState({
    name: 'CricketVerse Mega League 2026',
    edition: 'Edition V',
    gameMode: 'Custom Tournaments',
    format: 'Round Robin + 4-Team Playoff',
    teamCount: 4,
    venue: 'Eden Gardens, Kolkata',
    matchOvers: 20,
    prizePool: 500000000
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch tournaments
      const tourRes = await api.getTournaments();
      if (tourRes.success && tourRes.tournaments && tourRes.tournaments.length > 0) {
        setAllTournaments(tourRes.tournaments);
        const curTour = tourRes.tournaments[0];
        setTournament(curTour);
        // Fetch awards for active tournament
        const awRes = await api.getTournamentAwards(curTour.tournamentId || curTour._id);
        if (awRes.success && awRes.awards) {
          setAwards(awRes.awards);
        }
      }

      // 2. Fetch game modes catalog
      const modesRes = await api.getGameModes();
      if (modesRes.success && modesRes.modes) {
        setGameModes(modesRes.modes);
      }

      // 3. Fetch challenges, rivalries & scenarios
      api.getHistoricalChallenges().then(r => r.success && setHistoricalChallenges(r.challenges || [])).catch(console.error);
      api.getRivalries().then(r => r.success && setRivalries(r.rivalries || [])).catch(console.error);
      api.getScenarios().then(r => r.success && setScenarios(r.scenarios || [])).catch(console.error);
    } catch (err) {
      console.error('Error loading tournament dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1-Click Match Simulator
  const handleSimulateMatch = async (fixtureId) => {
    if (!tournament) return;
    sound.playClick();
    setSimulatingFixtureId(fixtureId);
    setSimulationMessage(null);

    try {
      const tourId = tournament.tournamentId || tournament._id;
      const res = await api.simulateTournamentFixture(tourId, fixtureId);
      if (res.success) {
        sound.playGavelStrike();
        setSimulationMessage(res.message || 'Match resolved and points updated!');
        if (res.tournament) {
          setTournament(res.tournament);
        }
        // Refresh awards
        const awRes = await api.getTournamentAwards(tourId);
        if (awRes.success && awRes.awards) {
          setAwards(awRes.awards);
        }
        setTimeout(() => setSimulationMessage(null), 5000);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      sound.playWarningBeep();
      alert(err.message || 'Error simulating match');
    } finally {
      setSimulatingFixtureId(null);
    }
  };

  // Submit Custom Tournament
  const handleCreateCustomTournament = async (e) => {
    e.preventDefault();
    sound.playClick();
    try {
      const defaultFranchises = [
        { name: 'Bangalore Royal Titans', shortCode: 'BRT' },
        { name: 'Mumbai Kings XI', shortCode: 'MKX' },
        { name: 'Chennai Super Vipers', shortCode: 'CSV' },
        { name: 'Hyderabad Sun Chargers', shortCode: 'HSC' },
        { name: 'Kolkata Night Knights', shortCode: 'KNK' },
        { name: 'Delhi Capitol Blitz', shortCode: 'DCB' }
      ];

      const selectedTeams = defaultFranchises.slice(0, Number(customForm.teamCount));

      const payload = {
        name: customForm.name,
        edition: customForm.edition,
        gameMode: customForm.gameMode,
        format: customForm.format,
        teams: selectedTeams,
        prizePool: Number(customForm.prizePool),
        venue: customForm.venue,
        rules: {
          oversPerInnings: Number(customForm.matchOvers),
          superOverOnTie: true
        }
      };

      const res = await api.createCustomTournament(payload);
      if (res.success && res.tournament) {
        sound.playGavelStrike();
        setTournament(res.tournament);
        setAllTournaments(prev => [res.tournament, ...prev]);
        setIsCustomModalOpen(false);
        setActiveTab('fixtures');
        if (res.hasByes) {
          alert(`Tournament created successfully with ${customForm.teamCount} teams! Odd team count detected: automatic balanced byes have been scheduled across rounds.`);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to generate custom tournament');
    }
  };

  if (loading || !tournament) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gold-400 font-mono text-sm">
        <RotateCw className="w-6 h-6 animate-spin text-gold-400" />
        <span>LOADING CHAMPIONSHIP BRACKETS & CAREER TOURNAMENTS...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 10 GAME MODES NAVIGATION CAROUSEL */}
      <div className="bg-stadium-950 p-3 rounded-3xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-gold-400" />
            <span className="font-display font-black text-xs uppercase text-slate-300">
              CRICKETVERSE MODES (10 OFFICIAL MODES)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            2–6 TEAMS • AUTOMATED BYES FOR 3 & 5 TEAMS
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {gameModes.map((mode) => {
            const isSelected = selectedGameMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedGameMode(mode.id);
                  if (mode.id === 'historical_challenges') {
                    setActiveTab('challenges');
                    setChallengeSubTab('historical');
                  } else if (mode.id === 'rivalry_matches') {
                    setActiveTab('challenges');
                    setChallengeSubTab('rivalries');
                  } else if (mode.id === 'scenario_challenges') {
                    setActiveTab('challenges');
                    setChallengeSubTab('scenarios');
                  } else if (mode.id === 'custom_tournaments') {
                    setIsCustomModalOpen(true);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-display font-bold uppercase flex items-center gap-1.5 flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                    : 'bg-stadium-900 border border-stadium-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.name}</span>
                <span className="text-[9px] font-mono opacity-80 px-1 py-0.2 rounded bg-black/20">
                  {mode.defaultFormat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tournament Banner */}
      <div className="bg-gradient-to-r from-stadium-950 via-stadium-900 to-stadium-950 border border-gold-500/30 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase">
              {tournament.edition || 'Season 2026'} • {tournament.format || 'T20 League'}
            </span>
            <span className="text-xs font-mono text-pitch-400 font-bold bg-pitch-500/10 px-2 py-0.5 rounded border border-pitch-500/30">
              ● {tournament.status === 'group_stage' ? 'GROUP STAGE ACTIVE' : 'PLAYOFF ROUND'}
            </span>
            {tournament.hasByes && (
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> BYE SCHEDULE ACTIVE (ODD TEAMS)
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            {tournament.name}
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Championship Purse: <strong className="text-gold-400">₹{((tournament.prizePool || 500000000) / 10000000).toFixed(0)} Crores</strong> • {tournament.teams?.length || tournament.standings?.length || 6} Franchises Competing • Top 4 advance to Playoffs
          </p>
        </div>

        {/* Action Controls & Primary Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setIsCustomModalOpen(true);
            }}
            className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-display font-black text-xs uppercase px-4 py-3 rounded-2xl shadow-gold-glow flex items-center justify-center gap-1.5 transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> CREATE TOURNAMENT (2–6 TEAMS)
          </button>

          {/* Primary View Switcher */}
          <div className="flex items-center gap-1 bg-stadium-950 p-1.5 rounded-2xl border border-stadium-800 overflow-x-auto">
            {[
              { id: 'table', label: 'Points Table', icon: TrendingUp },
              { id: 'awards', label: 'Caps & MVP', icon: Award },
              { id: 'playoffs', label: 'Playoffs', icon: Trophy },
              { id: 'fixtures', label: 'Fixtures', icon: Calendar },
              { id: 'challenges', label: 'Challenges', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-display uppercase font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {simulationMessage && (
        <div className="p-3.5 bg-pitch-500/10 border border-pitch-500/40 rounded-2xl text-pitch-300 font-mono text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-pitch-400 flex-shrink-0" />
          <span>{simulationMessage}</span>
        </div>
      )}

      {/* TAB 1: POINTS TABLE WITH OFFICIAL ICC NRR & FORM */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          <div className="bg-stadium-900 border border-stadium-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-stadium-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-black uppercase text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold-400" /> OFFICIAL LEAGUE STANDINGS & NRR
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  TOP 4 ADVANCE TO QUALIFIER 1 & ELIMINATOR • RANKINGS RESOLVED BY POINTS → NET RUN RATE → WINS
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-pitch-400 font-bold bg-pitch-500/10 px-2 py-0.5 rounded border border-pitch-500/30">
                  ● TOP 4: PLAYOFF QUALIFICATION
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-stadium-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-stadium-800">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Franchise</th>
                    <th className="py-3 px-3 text-center">Played</th>
                    <th className="py-3 px-3 text-center text-pitch-400">Won</th>
                    <th className="py-3 px-3 text-center text-red-400">Lost</th>
                    <th className="py-3 px-3 text-center text-slate-400">Tied</th>
                    <th className="py-3 px-4 text-center">Net Run Rate</th>
                    <th className="py-3 px-4 text-center">Recent Form (Last 5)</th>
                    <th className="py-3 px-4 text-center text-gold-400 font-bold">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stadium-800">
                  {(tournament.standings || []).map((team, idx) => {
                    const isTop4 = idx < 4;
                    const nrrVal = typeof team.nrr === 'number' ? team.nrr : parseFloat(team.nrr || 0);
                    return (
                      <tr
                        key={team.teamName}
                        className={`hover:bg-stadium-850/60 transition-colors ${
                          isTop4 ? 'bg-stadium-900/60 border-l-4 border-l-pitch-500' : ''
                        }`}
                      >
                        <td className="py-4 px-4 font-bold text-slate-300">
                          #{idx + 1}
                        </td>
                        <td className="py-4 px-4 font-sans font-bold text-white flex items-center gap-2">
                          <span className="font-display font-black text-xs text-gold-400 px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20">
                            {team.shortCode || team.teamName?.slice(0, 3)?.toUpperCase() || 'TM'}
                          </span>
                          <span>{team.teamName}</span>
                          {idx === 0 && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </td>
                        <td className="py-4 px-3 text-center text-slate-300">{team.played}</td>
                        <td className="py-4 px-3 text-center text-pitch-400 font-bold">{team.won}</td>
                        <td className="py-4 px-3 text-center text-red-400">{team.lost}</td>
                        <td className="py-4 px-3 text-center text-slate-400">{team.tied}</td>
                        <td className="py-4 px-4 text-center font-bold">
                          <span className={nrrVal >= 0 ? 'text-pitch-400' : 'text-red-400'}>
                            {nrrVal > 0 ? `+${nrrVal.toFixed(3)}` : nrrVal.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {team.form && team.form.length > 0 ? (
                              team.form.map((result, i) => (
                                <span
                                  key={i}
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                    result === 'W'
                                      ? 'bg-pitch-600 text-white'
                                      : result === 'L'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-slate-600 text-white'
                                  }`}
                                >
                                  {result}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
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

          {/* ICC Net Run Rate Explainer Formula Banner */}
          <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div>
              <span className="text-gold-400 font-bold uppercase block">
                Official ICC Net Run Rate (NRR) Formula:
              </span>
              <span>NRR = (Total Runs Scored ÷ Total Overs Faced) − (Total Runs Conceded ÷ Total Overs Bowled)</span>
            </div>
            <span className="text-[11px] text-slate-500 bg-stadium-900 px-3 py-1 rounded-xl self-start md:self-auto border border-stadium-800">
              *All-out innings counted as full 20.0 overs per ICC tournament regulations
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: TOURNAMENT CAPS & INDIVIDUAL AWARDS (ORANGE, PURPLE, MVP, SIXES, WICKETS, BEST CAPTAIN) */}
      {activeTab === 'awards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. ORANGE CAP (Leading Run Scorer) */}
            <div className="bg-gradient-to-b from-orange-950/40 via-stadium-900 to-stadium-950 border-2 border-orange-500/60 p-5 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-orange-500 text-slate-950 text-[10px] font-display font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                  ORANGE CAP
                </span>
                <span className="text-xs font-mono text-orange-400 font-bold">LEADING RUN SCORER</span>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 overflow-hidden flex-shrink-0">
                  {awards?.orangeCap?.photoUrl ? (
                    <img
                      src={awards.orangeCap.photoUrl}
                      alt={awards.orangeCap.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏏</div>
                  )}
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white uppercase leading-tight">
                    {awards?.orangeCap?.name || 'Virat Kohli'}
                  </h3>
                  <p className="text-xs font-mono text-orange-300">
                    {awards?.orangeCap?.team || 'Bangalore Royal Titans'}
                  </p>
                  <p className="font-display font-black text-2xl text-orange-400 mt-1">
                    {awards?.orangeCap?.runs || 741} <span className="text-xs font-mono font-normal text-slate-400">RUNS</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-500/20 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Balls Faced: {awards?.orangeCap?.balls || 478}</span>
                <span className="text-orange-400 font-bold">SR: 155.0</span>
              </div>
            </div>

            {/* 2. PURPLE CAP (Leading Wicket Taker) */}
            <div className="bg-gradient-to-b from-purple-950/40 via-stadium-900 to-stadium-950 border-2 border-purple-500/60 p-5 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-purple-500 text-slate-950 text-[10px] font-display font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                  PURPLE CAP
                </span>
                <span className="text-xs font-mono text-purple-400 font-bold">LEADING WICKET TAKER</span>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 overflow-hidden flex-shrink-0">
                  {awards?.purpleCap?.photoUrl ? (
                    <img
                      src={awards.purpleCap.photoUrl}
                      alt={awards.purpleCap.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎯</div>
                  )}
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white uppercase leading-tight">
                    {awards?.purpleCap?.name || 'Jasprit Bumrah'}
                  </h3>
                  <p className="text-xs font-mono text-purple-300">
                    {awards?.purpleCap?.team || 'Mumbai Kings XI'}
                  </p>
                  <p className="font-display font-black text-2xl text-purple-400 mt-1">
                    {awards?.purpleCap?.wickets || 22} <span className="text-xs font-mono font-normal text-slate-400">WICKETS</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-500/20 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Overs: {awards?.purpleCap?.overs || '54.2'}</span>
                <span className="text-purple-400 font-bold">ECON: 6.48</span>
              </div>
            </div>

            {/* 3. MVP (Most Valuable Player) */}
            <div className="bg-gradient-to-b from-amber-950/40 via-stadium-900 to-stadium-950 border-2 border-amber-500/60 p-5 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-display font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                  TOURNAMENT MVP
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">IMPACT INDEX</span>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 overflow-hidden flex-shrink-0">
                  {awards?.mvp?.photoUrl ? (
                    <img
                      src={awards.mvp.photoUrl}
                      alt={awards.mvp.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">⭐</div>
                  )}
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white uppercase leading-tight">
                    {awards?.mvp?.name || 'Virat Kohli'}
                  </h3>
                  <p className="text-xs font-mono text-amber-300">
                    {awards?.mvp?.team || 'Bangalore Royal Titans'}
                  </p>
                  <p className="font-display font-black text-2xl text-amber-400 mt-1">
                    {awards?.mvp?.points || 312} <span className="text-xs font-mono font-normal text-slate-400">PTS</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-500/20 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Stats: {awards?.mvp?.stats || '741 runs, 12 catches'}</span>
              </div>
            </div>

            {/* 4. BEST CAPTAIN */}
            <div className="bg-gradient-to-b from-cyan-950/40 via-stadium-900 to-stadium-950 border-2 border-cyan-500/60 p-5 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-cyan-400 text-slate-950 text-[10px] font-display font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                  BEST CAPTAIN
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">TACTICAL LEADERSHIP</span>
              </div>

              <div className="my-2">
                <h3 className="font-display font-black text-lg text-white uppercase leading-tight">
                  {awards?.bestCaptain?.name || 'Virat Kohli'}
                </h3>
                <p className="text-xs font-mono text-cyan-300">
                  {awards?.bestCaptain?.team || 'Bangalore Royal Titans'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div>
                    <span className="font-display font-black text-xl text-cyan-400">
                      {awards?.bestCaptain?.winRate || 71.4}%
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">Win Rate</span>
                  </div>
                  <div>
                    <span className="font-display font-black text-xl text-gold-400">
                      {awards?.bestCaptain?.trophies || 2}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">Titles</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-cyan-500/20 text-[10px] font-mono text-slate-400">
                <span>{awards?.bestCaptain?.reasons || 'Field placement efficiency & death-overs bowling rotations.'}</span>
              </div>
            </div>
          </div>

          {/* LEADERBOARDS: MOST SIXES & MOST WICKETS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Sixes Leaderboard */}
            <div className="bg-stadium-900 border border-stadium-800 rounded-3xl p-6 shadow-xl">
              <h3 className="font-display text-lg font-black uppercase text-white flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-amber-400" /> MOST SIXES (MAXIMUMS LEADERBOARD)
              </h3>
              <div className="space-y-2">
                {(awards?.mostSixes || []).map((player, idx) => (
                  <div
                    key={player.name}
                    className="p-3 bg-stadium-950 rounded-2xl border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-stadium-900 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-display font-bold text-sm text-white">{player.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{player.team}</p>
                      </div>
                    </div>
                    <span className="font-display font-black text-lg text-amber-400">
                      {player.sixes} <span className="text-xs font-mono font-normal text-slate-500">6s</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Wickets Leaderboard */}
            <div className="bg-stadium-900 border border-stadium-800 rounded-3xl p-6 shadow-xl">
              <h3 className="font-display text-lg font-black uppercase text-white flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-400" /> MOST WICKETS (PURPLE LEADERBOARD)
              </h3>
              <div className="space-y-2">
                {(awards?.mostWickets || []).map((player, idx) => (
                  <div
                    key={player.name}
                    className="p-3 bg-stadium-950 rounded-2xl border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-stadium-900 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-display font-bold text-sm text-white">{player.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{player.team}</p>
                      </div>
                    </div>
                    <span className="font-display font-black text-lg text-purple-400">
                      {player.wickets} <span className="text-xs font-mono font-normal text-slate-500">Wkts</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAYOFF KNOCKOUT ROADMAP */}
      {activeTab === 'playoffs' && (
        <div className="bg-stadium-900 border border-stadium-800 p-8 rounded-3xl shadow-xl">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-black uppercase text-white">
              PLAYOFF KNOCKOUT ROADMAP
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              IPL 4-TEAM QUALIFIER SYSTEM • RANK 1 & 2 RECEIVE DOUBLE ELIMINATION ADVANTAGE
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
                  {tournament.playoffs?.qualifier1?.team1 || 'Bangalore Royal Titans'}
                </p>
                <span className="text-xs text-slate-500 font-mono">VS</span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.qualifier1?.team2 || 'Mumbai Kings XI'}
                </p>
                <span className="text-[10px] font-mono text-pitch-400 block mt-2">
                  Winner advances directly to Grand Final
                </span>
              </div>

              <div className="bg-stadium-950 border border-stadium-800 p-5 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  ELIMINATOR (RANK 3 VS RANK 4)
                </span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.eliminator?.team1 || 'Chennai Super Vipers'}
                </p>
                <span className="text-xs text-slate-500 font-mono">VS</span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.eliminator?.team2 || 'Hyderabad Sun Chargers'}
                </p>
                <span className="text-[10px] font-mono text-red-400 block mt-2">
                  Loser knocked out of tournament
                </span>
              </div>
            </div>

            {/* Qualifier 2 */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full bg-stadium-950 border border-cyan-500/40 p-5 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block mb-1">
                  QUALIFIER 2
                </span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.qualifier2?.team1 || 'Loser Qualifier 1'}
                </p>
                <span className="text-xs text-slate-500 font-mono">VS</span>
                <p className="font-display font-bold text-sm text-white">
                  {tournament.playoffs?.qualifier2?.team2 || 'Winner Eliminator'}
                </p>
                <span className="text-[10px] font-mono text-gold-400 block mt-2">
                  Winner advances to Grand Final
                </span>
              </div>
            </div>

            {/* Grand Final Stage */}
            <div className="bg-gradient-to-b from-stadium-950 to-amber-950/40 border-2 border-gold-400 p-6 rounded-3xl text-center shadow-gold-glow">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-4xl mx-auto mb-3">
                🏆
              </div>
              <span className="text-[10px] font-mono font-bold text-gold-400 uppercase block">
                GRAND FINAL ARENA
              </span>
              <h3 className="font-display text-xl font-black uppercase text-white mt-1">
                {tournament.name} TROPHY
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-2">
                {tournament.playoffs?.final?.team1 || 'Winner Q1'} vs {tournament.playoffs?.final?.team2 || 'Winner Q2'}
              </p>
              <div className="mt-4 p-2 bg-stadium-900 rounded-xl text-gold-400 font-display font-bold text-xs uppercase">
                Prize Pool: ₹{((tournament.prizePool || 500000000) / 10000000).toFixed(0)} Crores
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FIXTURES WITH 1-CLICK MATCH SIMULATOR & ODD-TEAM BYES */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-black uppercase text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-400" /> TOURNAMENT FIXTURE SCHEDULE
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Total Fixtures: {tournament.fixtures?.length || 0}
            </span>
          </div>

          <div className="space-y-3">
            {(tournament.fixtures || []).map((fix) => {
              const isBye = fix.isBye === true;
              const isCompleted = fix.status === 'completed';
              const isLive = fix.status === 'live';
              const isSimulating = simulatingFixtureId === fix.id || simulatingFixtureId === String(fix.matchNo);

              return (
                <div
                  key={fix.id || fix.matchNo}
                  className={`p-5 rounded-2xl border transition-all ${
                    isBye
                      ? 'bg-stadium-950/60 border-dashed border-amber-500/30'
                      : isCompleted
                      ? 'bg-stadium-900/80 border-stadium-800'
                      : 'bg-stadium-900 border-white/10 hover:border-gold-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-stadium-950 border border-white/5 flex items-center justify-center font-display font-black text-sm text-gold-400 flex-shrink-0">
                        M{fix.matchNo}
                      </div>

                      <div>
                        {isBye ? (
                          <div>
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                              SCHEDULED BYE ROUND
                            </span>
                            <h4 className="font-display text-lg font-bold uppercase text-white mt-1">
                              {fix.team1} (REST ROUND)
                            </h4>
                            <p className="text-xs font-mono text-slate-400">
                              Odd team count bye: Team receives 0 overs and rests this round.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-display text-lg font-bold uppercase text-white">
                              {fix.team1} vs {fix.team2}
                            </h4>
                            <p className="text-xs font-mono text-slate-400">
                              {fix.venue || 'Eden Gardens'} • {fix.date || 'T20 Match'}
                            </p>
                            {isCompleted && (
                              <p className="text-xs font-mono text-pitch-400 font-bold mt-1">
                                {fix.result} • ({fix.team1Score || '184/5'} vs {fix.team2Score || '168/8'})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls for this match */}
                    {!isBye && (
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <span className="bg-stadium-950 text-slate-400 font-mono text-xs px-3 py-1.5 rounded-xl border border-white/5">
                            MATCH RESOLVED ✓
                          </span>
                        ) : (
                          <button
                            disabled={isSimulating}
                            onClick={() => handleSimulateMatch(fix.id || fix.matchNo)}
                            className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-slate-950 font-display font-black text-xs uppercase px-4 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-transform active:scale-95"
                          >
                            {isSimulating ? (
                              <>
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                SIMULATING...
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                SIMULATE MATCH
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: HISTORICAL CHALLENGES, MARQUEE RIVALRIES & SCENARIO DRILLS */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Subtab Selector */}
          <div className="flex items-center gap-2 bg-stadium-950 p-1.5 rounded-2xl border border-white/5">
            {[
              { id: 'historical', label: 'Historical Challenges (5)' },
              { id: 'rivalries', label: 'Marquee Rivalries (4)' },
              { id: 'scenarios', label: 'Scenario Drills (5)' }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  sound.playClick();
                  setChallengeSubTab(sub.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-display uppercase font-bold transition-all ${
                  challengeSubTab === sub.id
                    ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Subview 1: Historical Challenges */}
          {challengeSubTab === 'historical' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {historicalChallenges.map((item) => (
                <div
                  key={item.id}
                  className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4 hover:border-gold-500/40 transition-colors shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-gold-400 uppercase font-bold block mb-1">
                        HISTORICAL RECREATION • {item.venue}
                      </span>
                      <h3 className="font-display font-black text-xl text-white uppercase">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold bg-gold-500/10 text-gold-400 px-2.5 py-1 rounded-xl border border-gold-500/30 flex-shrink-0">
                      TARGET: {item.target}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-300 bg-stadium-950 p-3 rounded-2xl border border-white/5">
                    <strong>Situation:</strong> {item.situation}
                  </p>

                  <div className="text-[11px] font-mono text-slate-400">
                    <span className="text-pitch-400 font-bold block">Historical Outcome:</span>
                    <span>{item.historicalOutcome}</span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedChallenge(item);
                    }}
                    className="w-full py-2.5 rounded-xl bg-stadium-950 hover:bg-gold-500 hover:text-slate-950 text-gold-400 font-display font-bold text-xs uppercase border border-gold-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> INSPECT & PLAY CHALLENGE
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Subview 2: Marquee Rivalries */}
          {challengeSubTab === 'rivalries' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rivalries.map((item) => (
                <div
                  key={item.id}
                  className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4 hover:border-amber-500/40 transition-colors shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block mb-1">
                        {item.trophy}
                      </span>
                      <h3 className="font-display font-black text-xl text-white uppercase">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-2xl">⚔️</span>
                  </div>

                  <p className="text-xs font-mono text-slate-300">
                    {item.narrative}
                  </p>

                  <div className="p-3 bg-stadium-950 rounded-2xl border border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Atmosphere Factor:</span>
                    <span className="text-amber-400 font-bold uppercase">{item.atmosphereFactor}</span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedChallenge(item);
                    }}
                    className="w-full py-2.5 rounded-xl bg-stadium-950 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-display font-bold text-xs uppercase border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Swords className="w-3.5 h-3.5" /> ENTER DERBY CLASH
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Subview 3: Scenario Drills */}
          {challengeSubTab === 'scenarios' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {scenarios.map((item) => (
                <div
                  key={item.id}
                  className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4 hover:border-cyan-500/40 transition-colors shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                        DIFFICULTY: {item.difficulty}
                      </span>
                      <h3 className="font-display font-black text-xl text-white uppercase">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-xl border border-cyan-500/30">
                      {item.ballsRemaining} BALLS
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-300 bg-stadium-950 p-3 rounded-2xl border border-white/5">
                    <strong>Situation:</strong> {item.situation}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Target: {item.targetRuns} runs</span>
                    <span>Wickets Left: {item.wicketsInHand}</span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedChallenge(item);
                    }}
                    className="w-full py-2.5 rounded-xl bg-stadium-950 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-display font-bold text-xs uppercase border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Target className="w-3.5 h-3.5" /> LAUNCH SCENARIO DRILL
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CUSTOM TOURNAMENT BUILDER (2–6 TEAMS, ODD-TEAM BYES) */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-stadium-900 border border-gold-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative"
          >
            <button
              onClick={() => setIsCustomModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gold-500/20 text-gold-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase">
                PHASE 11 ENGINE
              </span>
            </div>
            <h2 className="font-display font-black text-2xl uppercase text-white mb-4">
              CUSTOM TOURNAMENT CREATOR
            </h2>

            <form onSubmit={handleCreateCustomTournament} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-slate-300 block mb-1">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  className="w-full bg-stadium-950 border border-stadium-800 rounded-xl p-3 text-white text-xs font-mono focus:border-gold-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase text-slate-300 block mb-1">
                    Number of Teams (2 to 6)
                  </label>
                  <select
                    value={customForm.teamCount}
                    onChange={(e) => setCustomForm({ ...customForm, teamCount: Number(e.target.value) })}
                    className="w-full bg-stadium-950 border border-stadium-800 rounded-xl p-3 text-white text-xs font-mono focus:border-gold-500 focus:outline-none"
                  >
                    <option value={2}>2 Teams (Direct Finals)</option>
                    <option value={3}>3 Teams (Rotating Byes)</option>
                    <option value={4}>4 Teams (IPL Qualifier Tree)</option>
                    <option value={5}>5 Teams (Rotating Byes)</option>
                    <option value={6}>6 Teams (Full League)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-slate-300 block mb-1">
                    Overs per Match
                  </label>
                  <select
                    value={customForm.matchOvers}
                    onChange={(e) => setCustomForm({ ...customForm, matchOvers: Number(e.target.value) })}
                    className="w-full bg-stadium-950 border border-stadium-800 rounded-xl p-3 text-white text-xs font-mono focus:border-gold-500 focus:outline-none"
                  >
                    <option value={5}>5 Overs (Blitz)</option>
                    <option value={10}>10 Overs (T10)</option>
                    <option value={20}>20 Overs (Standard T20)</option>
                    <option value={50}>50 Overs (ODI World Cup)</option>
                  </select>
                </div>
              </div>

              {/* Byes Notice Banner */}
              {(customForm.teamCount === 3 || customForm.teamCount === 5) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-[11px] font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>AUTOMATIC BYE SCHEDULER:</strong> With {customForm.teamCount} teams (odd count), each team receives 1 rotating scheduled bye round so all fixtures remain balanced!
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase text-slate-300 block mb-1">
                    Championship Venue
                  </label>
                  <select
                    value={customForm.venue}
                    onChange={(e) => setCustomForm({ ...customForm, venue: e.target.value })}
                    className="w-full bg-stadium-950 border border-stadium-800 rounded-xl p-3 text-white text-xs font-mono focus:border-gold-500 focus:outline-none"
                  >
                    <option value="Eden Gardens, Kolkata">Eden Gardens, Kolkata</option>
                    <option value="Wankhede Stadium, Mumbai">Wankhede Stadium, Mumbai</option>
                    <option value="Narendra Modi Stadium, Ahmedabad">Narendra Modi Stadium, Ahmedabad</option>
                    <option value="Lord's, London">Lord's, London</option>
                    <option value="Melbourne Cricket Ground (MCG)">Melbourne Cricket Ground (MCG)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-slate-300 block mb-1">
                    Prize Pool (₹ Crores)
                  </label>
                  <input
                    type="number"
                    value={customForm.prizePool / 10000000}
                    onChange={(e) => setCustomForm({ ...customForm, prizePool: Number(e.target.value) * 10000000 })}
                    className="w-full bg-stadium-950 border border-stadium-800 rounded-xl p-3 text-white text-xs font-mono focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-display font-black uppercase text-xs tracking-wider shadow-gold-glow transition-transform active:scale-95"
                >
                  INITIALIZE TOURNAMENT BRACKETS
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: CHALLENGE / SCENARIO DETAIL BRIEFING */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-stadium-900 border border-gold-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => setSelectedChallenge(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="bg-gold-500/20 text-gold-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase">
              CRICKETVERSE CHALLENGE ARENA
            </span>

            <h2 className="font-display font-black text-2xl uppercase text-white">
              {selectedChallenge.title}
            </h2>

            <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 space-y-2 text-xs font-mono text-slate-300">
              <p>
                <strong>Situation:</strong> {selectedChallenge.situation || selectedChallenge.narrative}
              </p>
              {selectedChallenge.target && (
                <p className="text-gold-400 font-bold">Target to Win: {selectedChallenge.target} runs</p>
              )}
              {selectedChallenge.historicalOutcome && (
                <p className="text-pitch-300 font-semibold">
                  Historical Outcome: {selectedChallenge.historicalOutcome}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                sound.playGavelStrike();
                alert(`Starting ${selectedChallenge.title}! Match engine synchronized.`);
                setSelectedChallenge(null);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-display font-black uppercase text-xs shadow-gold-glow"
            >
              START MATCH SIMULATION
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
