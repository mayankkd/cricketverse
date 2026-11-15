import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Radio,
  Flame,
  Shield,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Sliders,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { sound } from '../services/sound';
import { socketService } from '../services/socket';
import { TacticalManagementModal } from '../components/tactics/TacticalManagementModal';
import { CricketArena } from '../game/CricketArena';

export const MatchCenter = () => {
  const [match, setMatch] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [activeView, setActiveView] = useState('arena'); // 'arena' | 'broadcast' | 'both'
  const [userRole, setUserRole] = useState('player'); // 'player' | 'spectator'
  const [matchNotification, setMatchNotification] = useState(null);

  useEffect(() => {
    const matchId = 'LIVE-IPL-FINAL';

    const fetchMatch = async () => {
      try {
        const res = await api.getMatchById(matchId);
        if (res.success && res.match) {
          setMatch(res.match);
        }
      } catch (err) {
        console.error('Error fetching match:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();

    // Real-time Multiplayer Socket Connection
    socketService.joinMatch(matchId, { role: userRole });

    const unsubSnapshot = socketService.onMatchSnapshot((snapshot) => {
      setMatch(snapshot);
      setLoading(false);
    });

    const unsubState = socketService.onMatchState((updatedState) => {
      setMatch(updatedState);
    });

    const unsubNotification = socketService.onMatchNotification((notif) => {
      setMatchNotification(notif.text);
      setTimeout(() => setMatchNotification(null), 4000);
    });

    const unsubDelivery = socketService.onDeliveryResult((res) => {
      if (res.snapshot) setMatch(res.snapshot);
      if (res.outcome?.badge === 'SIX') sound.playSixHit();
      else if (res.outcome?.badge === 'FOUR' || res.outcome?.badge === 'WICKET') sound.playBatCrack();
      else sound.playClick();
    });

    const unsubInnings = socketService.onInningsEnded((data) => {
      setMatchNotification(`INNINGS BREAK! Target: ${data.targetScore} runs.`);
      sound.playClick();
    });

    const unsubEnded = socketService.onMatchEnded((data) => {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      sound.playSixHit();
    });

    return () => {
      unsubSnapshot();
      unsubState();
      unsubNotification();
      unsubDelivery();
      unsubInnings();
      unsubEnded();
    };
  }, [userRole]);

  // Auto-play interval
  useEffect(() => {
    let interval = null;
    if (autoPlay && match && match.status !== 'completed') {
      interval = setInterval(() => {
        handleSimulateBall();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoPlay, match]);

  const handleSimulateBall = async () => {
    try {
      const res = await api.simulateBall('LIVE-IPL-FINAL');
      if (res.success && res.match) {
        setMatch(res.match);
        const outcome = res.outcome;

        if (outcome.badge === 'SIX') {
          sound.playSixHit();
        } else if (outcome.badge === 'FOUR') {
          sound.playBatCrack();
        } else if (outcome.badge === 'WICKET') {
          sound.playBatCrack();
        } else {
          sound.playClick();
        }

        if (res.match.status === 'completed') {
          setAutoPlay(false);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 }
          });
        }
      }
    } catch (err) {
      console.error('Error simulating ball:', err);
    }
  };

  if (loading || !match) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gold-400 font-mono text-sm">
        CONNECTING TO LIVE BROADCAST SATELLITE...
      </div>
    );
  }

  const strikeRate = ((match.currentStriker.runs / match.currentStriker.balls) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top View Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-stadium-950 p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => { sound.playClick(); setActiveView('arena'); }}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeView === 'arena'
                ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎮 2D PLAYABLE ARENA (PHASER 3)
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveView('broadcast'); }}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeView === 'broadcast'
                ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 BROADCAST HUD & WORM
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveView('both'); }}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeView === 'both'
                ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ SPLIT THEATER VIEW
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Role Switcher */}
          <div className="flex items-center gap-1 bg-stadium-950 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => { sound.playClick(); setUserRole('player'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                userRole === 'player'
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏏 PLAYER
            </button>
            <button
              onClick={() => { sound.playClick(); setUserRole('spectator'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                userRole === 'spectator'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👁️ SPECTATOR
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setIsTacticsOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-display uppercase font-bold flex items-center gap-1.5 bg-stadium-900 border border-gold-500/40 text-gold-400 hover:bg-gold-500 hover:text-slate-950 transition-all shadow-gold-glow"
          >
            <Sliders className="w-3.5 h-3.5" /> TACTICAL SETUP
          </button>
        </div>
      </div>

      {/* Match Notification Banner */}
      {matchNotification && (
        <div className="bg-gold-500/10 border border-gold-500/40 text-gold-400 p-3 rounded-2xl text-xs font-mono flex items-center justify-between shadow-gold-glow animate-pulse">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {matchNotification}
          </span>
          <button onClick={() => setMatchNotification(null)} className="text-white hover:text-gold-300 font-bold">✕</button>
        </div>
      )}

      {/* 2D PLAYABLE PHASER 3 ARENA */}
      {(activeView === 'arena' || activeView === 'both') && (
        <CricketArena
          match={match}
          onMatchUpdated={(updated) => setMatch(updated)}
          isSpectator={userRole === 'spectator'}
          format={match.format}
        />
      )}

      {/* Broadcast Graphics Header Bar */}
      <div className="bg-stadium-950 border border-stadium-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stadium-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-red-600 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              <Radio className="w-3.5 h-3.5" /> BROADCAST LIVE
            </span>
            <span className="text-xs font-mono text-slate-400 flex flex-wrap items-center gap-2">
              <span>{match.stadium?.name || match.venue}</span>
              <span>•</span>
              <span className="text-gold-400 font-bold">{match.format}</span>
              <span>•</span>
              <span className="text-pitch-400">Pitch: {match.stadium?.pitchType || 'Turning'}</span>
              <span>•</span>
              <span className="text-sky-400">{match.weather?.condition || 'Clear'}</span>
              {match.format === 'TEST' && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">Day {match.testDetails?.day || 1} ({match.testDetails?.session || 'Morning'})</span>
                </>
              )}
              {match.weather?.isDLSActive && (
                <>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">DLS Target: {match.weather.dlsDetails?.revisedTarget}</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setAutoPlay(!autoPlay);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-display uppercase font-bold flex items-center gap-1.5 transition-all ${
                autoPlay
                  ? 'bg-pitch-500 text-slate-950 shadow-pitch-glow'
                  : 'bg-stadium-900 border border-stadium-700 text-slate-300 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {autoPlay ? 'AUTO PLAYING (3s)' : 'AUTO SIMULATE'}
            </button>

            <button
              onClick={handleSimulateBall}
              disabled={match.status === 'completed'}
              className="bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-slate-950 font-display uppercase font-bold text-xs px-5 py-2 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> SIMULATE NEXT BALL
            </button>
          </div>
        </div>

        {/* Live Scoreboard Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 items-center">
          {/* Team A (Chasing) */}
          <div className="p-4 rounded-2xl bg-stadium-900 border border-gold-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-lg text-white">
                {match.teamA.name}
              </span>
              <span className="bg-gold-500 text-slate-950 font-mono font-bold text-xs px-2 py-0.5 rounded">
                CHASING
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display font-black text-5xl text-gold-400 tracking-tight">
                {match.teamA.score}/{match.teamA.wickets}
              </span>
              <span className="font-mono text-base text-slate-400">
                ({match.teamA.overs} / {match.teamA.maxOvers} ov)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Current Run Rate: <strong className="text-pitch-400">{(match.teamA.score / (match.teamA.overs || 1)).toFixed(2)} RPO</strong>
            </p>
          </div>

          {/* Team B (Target) */}
          <div className="p-4 rounded-2xl bg-stadium-900 border border-stadium-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-lg text-slate-300">
                {match.teamB.name}
              </span>
              <span className="bg-stadium-800 text-slate-400 font-mono text-xs px-2 py-0.5 rounded">
                1ST INNINGS
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display font-black text-4xl text-slate-300">
                {match.teamB.score}/{match.teamB.wickets}
              </span>
              <span className="font-mono text-sm text-slate-500">
                ({match.teamB.overs} ov)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {match.result || 'Target: 179 runs to win'}
            </p>
          </div>
        </div>

        {/* Recent Deliveries Strip */}
        <div className="flex items-center gap-3 pt-3 border-t border-stadium-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
            THIS OVER:
          </span>
          <div className="flex items-center gap-2">
            {match.recentBalls?.map((ball, idx) => (
              <span
                key={idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs ${
                  ball === '6'
                    ? 'bg-purple-600 text-white shadow-lg animate-bounce'
                    : ball === '4'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : ball === 'W'
                    ? 'bg-red-600 text-white shadow-lg animate-ping'
                    : 'bg-stadium-900 text-slate-300 border border-white/10'
                }`}
              >
                {ball}
              </span>
            ))}
          </div>
        </div>

        {/* Live Broadcast Tactical Telemetry HUD */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stadium-800 text-[11px] font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Field: <strong className="text-white uppercase">{match.teamBTactics?.fieldPlacement?.preset || 'Powerplay'}</strong> (9 Fielders)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-gold-400" />
              <span>Striker Tempo: <strong className="text-gold-400 uppercase">Anchor</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-pitch-400" />
              <span>Delivery Tactic: <strong className="text-pitch-400 uppercase">Yorker</strong></span>
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setIsTacticsOpen(true);
            }}
            className="text-[10px] uppercase font-bold text-gold-400 hover:text-gold-300 underline underline-offset-4 flex items-center gap-1"
          >
            Adjust Field & Strategies →
          </button>
        </div>
      </div>

      {/* Batsmen & Bowler Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Striker */}
        <div className="bg-stadium-900 border border-gold-500/40 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-20 h-24 rounded-2xl overflow-hidden border border-gold-500/50 flex-shrink-0 shadow-gold-glow">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg"
              alt="Striker"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-gold-400">ON STRIKE ★</span>
              <span className="text-[10px] font-mono text-slate-400">{strikeRate} SR</span>
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-white truncate">
              {match.currentStriker?.name}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-gold-400">
                {match.currentStriker?.runs}*
              </span>
              <span className="font-mono text-xs text-slate-400">
                ({match.currentStriker?.balls}b)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex gap-3 mt-1">
              <span>4s: <strong className="text-white">{match.currentStriker?.fours}</strong></span>
              <span>6s: <strong className="text-white">{match.currentStriker?.sixes}</strong></span>
            </div>
          </div>
        </div>

        {/* Non-Striker */}
        <div className="bg-stadium-900 border border-stadium-800 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-20 h-24 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Heinrich_Klaasen_2023.jpg/440px-Heinrich_Klaasen_2023.jpg"
              alt="Non-Striker"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">NON-STRIKER</span>
              <span className="text-[10px] font-mono text-slate-400">
                {((match.currentNonStriker.runs / match.currentNonStriker.balls) * 100).toFixed(1)} SR
              </span>
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-white truncate">
              {match.currentNonStriker?.name}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-slate-200">
                {match.currentNonStriker?.runs}*
              </span>
              <span className="font-mono text-xs text-slate-400">
                ({match.currentNonStriker?.balls}b)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex gap-3 mt-1">
              <span>4s: <strong className="text-white">{match.currentNonStriker?.fours}</strong></span>
              <span>6s: <strong className="text-white">{match.currentNonStriker?.sixes}</strong></span>
            </div>
          </div>
        </div>

        {/* Current Bowler */}
        <div className="bg-stadium-900 border border-pitch-500/40 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-20 h-24 rounded-2xl overflow-hidden border border-pitch-500/50 flex-shrink-0 shadow-pitch-glow">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg"
              alt="Bowler"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-pitch-400">BOWLING SPELL</span>
              <span className="text-[10px] font-mono text-pitch-400">
                {(match.currentBowler.runs / (match.currentBowler.overs || 1)).toFixed(2)} ECON
              </span>
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-white truncate">
              {match.currentBowler?.name}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-pitch-400">
                {match.currentBowler?.wickets}-{match.currentBowler?.runs}
              </span>
              <span className="font-mono text-xs text-slate-400">
                ({match.currentBowler?.overs} ov)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex gap-3 mt-1">
              <span>Maidens: <strong className="text-white">{match.currentBowler?.maidens}</strong></span>
              <span>Speed: <strong className="text-pitch-400">146.4 km/h</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Worm Run Rate Comparison Chart & Commentary Feed */}
      {(activeView === 'broadcast' || activeView === 'both') ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Worm Run Rate Chart (2 Cols) */}
          <div className="lg:col-span-2 bg-stadium-900 border border-stadium-800 p-6 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-bold uppercase text-white">
                  LIVE WORM GRAPH & RUN PROGRESSION
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  OVER-BY-OVER SCORING RATE COMPARISON
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-gold-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={match.wormData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="over" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 200]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="teamAScore" name={match.teamA.name} stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="teamBScore" name={match.teamB.name} stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 border-t border-stadium-800 pt-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-gold-400 font-bold">
                ― {match.teamA.name} (Current Inning)
              </span>
              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                ╌ {match.teamB.name} (Target Score)
              </span>
            </div>
          </div>

          {/* Live Commentary Feed (1 Col) */}
          <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl flex flex-col h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-stadium-800 mb-3">
              <h3 className="font-display text-base font-bold uppercase text-white">
                LIVE COMMENTARY
              </h3>
              <span className="text-[10px] font-mono text-pitch-400 font-bold">ENGLISH ON AIR</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {match.commentary?.map((item) => (
                <div key={item.id} className="p-3 rounded-2xl bg-stadium-950 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gold-400">
                      Over {item.over}
                    </span>
                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${
                      item.badge === 'SIX' ? 'bg-purple-500 text-white' :
                      item.badge === 'FOUR' ? 'bg-cyan-500 text-slate-950' :
                      item.badge === 'WICKET' ? 'bg-red-500 text-white' :
                      'bg-stadium-800 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Sleek Live Commentary Strip for Arena Mode */
        <div className="bg-stadium-900 border border-stadium-800 p-5 rounded-3xl">
          <div className="flex items-center justify-between pb-2 border-b border-stadium-800 mb-3">
            <h3 className="font-display text-sm font-bold uppercase text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-pitch-400 animate-pulse" /> LIVE BROADCAST COMMENTARY LOG
            </h3>
            <span className="text-[10px] font-mono text-gold-400 uppercase font-bold">
              LATEST DELIVERIES
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {match.commentary?.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3 rounded-2xl bg-stadium-950 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gold-400">
                    Over {item.over}
                  </span>
                  <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${
                    item.badge === 'SIX' ? 'bg-purple-500 text-white' :
                    item.badge === 'FOUR' ? 'bg-cyan-500 text-slate-950' :
                    item.badge === 'WICKET' ? 'bg-red-500 text-white' :
                    'bg-stadium-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tactical Management Center Modal */}
      <TacticalManagementModal
        isOpen={isTacticsOpen}
        onClose={() => setIsTacticsOpen(false)}
        matchId="LIVE-IPL-FINAL"
        teamKey="teamB"
        format={match.format || 'T20'}
        initialTactics={match.teamBTactics}
        tacticalBreak={match.tacticalBreak || 'live'}
        onSaveSuccess={(newTactics) => {
          setMatch(prev => ({
            ...prev,
            teamBTactics: newTactics
          }));
        }}
      />
    </div>
  );
};

