import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  Flame,
  Award,
  CloudSun,
  MapPin,
  RefreshCw,
  Share2
} from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import commentaryTTS from '../services/commentaryTTS';

// Analytics Components
import WagonWheel from '../components/analytics/WagonWheel';
import ManhattanChart from '../components/analytics/ManhattanChart';
import WormChart from '../components/analytics/WormChart';
import PitchMap from '../components/analytics/PitchMap';
import PartnershipGraph from '../components/analytics/PartnershipGraph';
import FallOfWickets from '../components/analytics/FallOfWickets';
import BowlingFigures from '../components/analytics/BowlingFigures';
import RunRateGraph from '../components/analytics/RunRateGraph';
import PlayerComparisonModal from '../components/analytics/PlayerComparisonModal';
import MatchHighlights from '../components/analytics/MatchHighlights';
import MatchSummaryCard from '../components/analytics/MatchSummaryCard';

export default function BroadcastMode() {
  const { matchId: routeMatchId } = useParams();
  const matchId = routeMatchId || 'LIVE-IPL-FINAL';

  const [match, setMatch] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('wagonWheel'); // wagonWheel, pitchMap, manhattan, worm, partnerships, bowling, highlights
  const [personality, setPersonality] = useState('Professional'); // Professional, Hype, Savage
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentFlash, setRecentFlash] = useState(null);

  const containerRef = useRef(null);

  // Initial load: Fetch authoritative match telemetry
  const loadMatchData = async () => {
    try {
      const [matchRes, analyticsRes] = await Promise.all([
        api.getMatchById(matchId).catch(() => ({ success: false })),
        api.getMatchAnalytics(matchId).catch(() => ({ success: false }))
      ]);

      if (matchRes.success && matchRes.match) {
        setMatch(matchRes.match);
        if (matchRes.match.commentaryPersonality) {
          setPersonality(matchRes.match.commentaryPersonality);
        }
      }

      if (analyticsRes.success && analyticsRes.analytics) {
        setAnalytics(analyticsRes.analytics);
      }
    } catch (err) {
      console.error('[Broadcast] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchData();
  }, [matchId]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    const socket = socketService.connect();

    // Join match broadcast room as Spectator (Strictly read-only)
    socket.emit('join_match', {
      matchId,
      role: 'spectator'
    });

    const handleMatchState = (snapshot) => {
      if (!snapshot) return;
      setMatch(prev => ({ ...(prev || {}), ...snapshot }));
      if (snapshot.commentaryPersonality) {
        setPersonality(snapshot.commentaryPersonality);
      }
    };

    const handleDeliveryResult = (deliveryEvent) => {
      if (!deliveryEvent) return;

      const { outcome, deliveryData, snapshot } = deliveryEvent;
      if (snapshot) setMatch(snapshot);

      // Trigger flash banner
      if (outcome?.badge) {
        setRecentFlash(outcome.badge);
        setTimeout(() => setRecentFlash(null), 3500);
      }

      // Text-To-Speech broadcast trigger
      if (isTTSActive && deliveryData?.multiCommentary) {
        const text = deliveryData.multiCommentary[personality] || deliveryData.commentary;
        commentaryTTS.speak(text, personality);
      }

      // Refresh analytics
      api.getMatchAnalytics(matchId).then(res => {
        if (res.success && res.analytics) setAnalytics(res.analytics);
      }).catch(() => {});
    };

    const handlePersonalityChanged = ({ personality: newP, snapshot }) => {
      if (newP) setPersonality(newP);
      if (snapshot) setMatch(snapshot);
    };

    socket.on('match_state', handleMatchState);
    socket.on('delivery_result', handleDeliveryResult);
    socket.on('commentary_personality_changed', handlePersonalityChanged);

    return () => {
      socket.off('match_state', handleMatchState);
      socket.off('delivery_result', handleDeliveryResult);
      socket.off('commentary_personality_changed', handlePersonalityChanged);
      commentaryTTS.stop();
    };
  }, [matchId, isTTSActive, personality]);

  // Toggle commentary personality
  const handlePersonalityChange = async (newPersona) => {
    setPersonality(newPersona);
    try {
      await api.setCommentaryPersonality(matchId, newPersona);
      socketService.getSocket()?.emit('change_commentary_personality', {
        matchId,
        personality: newPersona
      });
    } catch (err) {
      console.warn('Failed to sync personality to server:', err);
    }
  };

  // Toggle TTS speech
  const toggleTTS = () => {
    const nextState = !isTTSActive;
    setIsTTSActive(nextState);
    commentaryTTS.toggleTTS(nextState);
    if (nextState && match?.commentary?.[0]) {
      const topComm = match.commentary[0];
      const text = topComm.multiCommentary?.[personality] || topComm.text;
      commentaryTTS.speak(text, personality);
    }
  };

  // Toggle browser fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  // Batting / Bowling calculations
  const battingTeam = useMemo(() => {
    if (!match) return { name: 'Batting Team', score: 184, wickets: 3, overs: 18.2, maxOvers: 20 };
    return match.battingTeamKey === 'teamA' ? match.teamA : match.teamB;
  }, [match]);

  const bowlingTeam = useMemo(() => {
    if (!match) return { name: 'Bowling Team', score: 178, wickets: 6, overs: 20, maxOvers: 20 };
    return match.bowlingTeamKey === 'teamA' ? match.teamA : match.teamB;
  }, [match]);

  const crr = useMemo(() => {
    const ov = Math.max(0.1, battingTeam.overs || 0);
    return ((battingTeam.score || 0) / ov).toFixed(2);
  }, [battingTeam]);

  const rrr = useMemo(() => {
    if (!match?.targetScore) return null;
    const remainingRuns = Math.max(0, match.targetScore - (battingTeam.score || 0));
    const remainingOvers = Math.max(0.1, (battingTeam.maxOvers || 20) - (battingTeam.overs || 0));
    return (remainingRuns / remainingOvers).toFixed(2);
  }, [match, battingTeam]);

  // Striker & Bowler with photographs & OVR
  const striker = match?.currentStriker || {
    name: 'Virat Kohli',
    runs: 68,
    balls: 41,
    fours: 6,
    sixes: 3,
    ovr: 115,
    countryFlag: '🇮🇳',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg'
  };

  const nonStriker = match?.currentNonStriker || {
    name: 'Glenn Maxwell',
    runs: 34,
    balls: 19,
    fours: 3,
    sixes: 2,
    ovr: 108,
    countryFlag: '🇦🇺'
  };

  const bowler = match?.currentBowler || {
    name: 'Jasprit Bumrah',
    overs: '3.2',
    maidens: 1,
    runs: 21,
    wickets: 2,
    ovr: 118,
    countryFlag: '🇮🇳',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg'
  };

  const deliveries = analytics?.deliveries || match?.deliveries || [];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white"
    >
      {/* Top TV Broadcast Ribbon */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-rose-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs uppercase tracking-wider shadow-md shadow-rose-600/30 animate-pulse">
            <Tv className="w-4 h-4" /> LIVE BROADCAST
          </div>
          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="text-white font-bold">{match?.title || 'CricketVerse Championship'}</span>
            <span className="text-slate-500 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> {match?.stadium?.name || match?.venue || 'Eden Gardens'}
            </span>
          </div>
        </div>

        {/* Read-Only Spectator Pill & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spectator Mode (Read-Only)</span>
          </div>

          {/* Personality Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
            {['Professional', 'Hype', 'Savage'].map(p => (
              <button
                key={p}
                onClick={() => handlePersonalityChange(p)}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs font-semibold ${
                  personality === p
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Text-To-Speech Toggle */}
          <button
            onClick={toggleTTS}
            title={isTTSActive ? 'Mute AI Commentary Voice' : 'Enable AI Commentary Voice'}
            className={`p-2 rounded-xl border transition-all ${
              isTTSActive
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isTTSActive ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Player Comparison Modal Button */}
          <button
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Broadcast Studio View */}
      <main className="max-w-7xl mx-auto w-full px-4 py-5 flex-1 space-y-5">
        {/* TV Style Main Scoreboard Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          {/* Recent Event Flash Overlay */}
          {recentFlash && (
            <div className="absolute top-2 right-4 animate-bounce">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${
                recentFlash === 'SIX' ? 'bg-purple-600 text-white shadow-purple-600/50' :
                recentFlash === 'FOUR' ? 'bg-emerald-600 text-white shadow-emerald-600/50' :
                'bg-red-600 text-white shadow-red-600/50'
              }`}>
                {recentFlash}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Team Scores */}
            <div className="lg:col-span-5 flex items-center justify-between gap-4 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                  {match?.format || 'T20'} • {match?.status?.toUpperCase() || 'LIVE'}
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {battingTeam.name}
                </h1>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-white font-mono">
                    {battingTeam.score}/{battingTeam.wickets}
                  </span>
                  <span className="text-slate-400 text-sm font-mono">
                    ({battingTeam.overs} / {battingTeam.maxOvers} ov)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">
                  CRR: <span className="font-mono font-bold text-white text-sm">{crr}</span>
                </div>
                {rrr && (
                  <div className="text-xs text-rose-400 mt-0.5">
                    RRR: <span className="font-mono font-bold text-sm">{rrr}</span>
                  </div>
                )}
                {match?.targetScore && (
                  <div className="text-xs font-mono font-bold text-amber-400 mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Target {match.targetScore}
                  </div>
                )}
              </div>
            </div>

            {/* Live Batters in Middle */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-5">
              {/* Striker */}
              <div className="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-2.5 flex items-center gap-2.5 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-400 overflow-hidden flex-shrink-0">
                  {striker.photoUrl ? (
                    <img src={striker.photoUrl} alt={striker.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-emerald-400 text-xs">
                      {striker.name[0]}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-white truncate max-w-[85px]">{striker.name}</span>
                    <span className="text-emerald-400 font-black text-xs">*</span>
                  </div>
                  <div className="font-mono font-extrabold text-emerald-400 text-xs">
                    {striker.runs} <span className="text-[10px] text-slate-400 font-normal">({striker.balls})</span>
                  </div>
                  <div className="text-[9px] text-amber-400 font-mono font-bold">{striker.ovr || 115} OVR</div>
                </div>
              </div>

              {/* Non-Striker */}
              <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-2.5 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0">
                  {nonStriker.photoUrl ? (
                    <img src={nonStriker.photoUrl} alt={nonStriker.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                      {nonStriker.name[0]}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-xs text-slate-300 truncate block max-w-[85px]">{nonStriker.name}</span>
                  <div className="font-mono font-extrabold text-slate-200 text-xs">
                    {nonStriker.runs} <span className="text-[10px] text-slate-400 font-normal">({nonStriker.balls})</span>
                  </div>
                  <div className="text-[9px] text-amber-400 font-mono font-bold">{nonStriker.ovr || 108} OVR</div>
                </div>
              </div>
            </div>

            {/* Current Bowler & Recent Deliveries */}
            <div className="lg:col-span-3 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-2.5 bg-slate-800/40 p-2.5 rounded-2xl border border-slate-700/60">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-purple-400 overflow-hidden flex-shrink-0">
                  {bowler.photoUrl ? (
                    <img src={bowler.photoUrl} alt={bowler.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-purple-400 text-xs">
                      {bowler.name[0]}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-xs text-white truncate block">{bowler.name}</span>
                  <div className="font-mono text-purple-400 text-xs font-bold">
                    {bowler.wickets}-{bowler.runs} <span className="text-[10px] text-slate-400 font-normal">({bowler.overs} ov)</span>
                  </div>
                  <div className="text-[9px] text-amber-400 font-mono font-bold">{bowler.ovr || 118} OVR</div>
                </div>
              </div>

              {/* Recent Deliveries Strip */}
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">This Over:</span>
                {(match?.recentBalls && match.recentBalls.length > 0 ? match.recentBalls.slice(0, 6) : ['0', '4', '1', '6', 'W', '2']).map((b, idx) => (
                  <span
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      b === '6' ? 'bg-purple-600 text-white' :
                      b === '4' ? 'bg-emerald-600 text-white' :
                      b === 'W' ? 'bg-red-600 text-white' :
                      b === '0' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                      'bg-blue-600 text-white'
                    }`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Commentary Marquee */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl px-5 py-3 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold uppercase tracking-wider flex-shrink-0">
              {personality} Commentary
            </span>
            <p className="text-xs md:text-sm text-slate-200 italic font-serif truncate">
              "{match?.commentary?.[0]?.multiCommentary?.[personality] || match?.commentary?.[0]?.text || 'What an electric atmosphere here inside the stadium! High quality cricket on display.'}"
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex-shrink-0">
            Ov {match?.commentary?.[0]?.over || battingTeam.overs}
          </div>
        </div>

        {/* Tabbed Analytics & Television Graphics Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-semibold">
          {[
            { id: 'wagonWheel', label: 'Wagon Wheel' },
            { id: 'pitchMap', label: 'Pitch Map' },
            { id: 'manhattan', label: 'Manhattan Chart' },
            { id: 'worm', label: 'Worm & Run Rate' },
            { id: 'partnerships', label: 'Partnerships & FOW' },
            { id: 'bowling', label: 'Scorecards' },
            { id: 'highlights', label: 'Highlights & Replay' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="animate-fade-in">
          {activeTab === 'wagonWheel' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-6">
                <WagonWheel deliveries={deliveries} boundaryMeters={match?.stadium?.boundaryDimensions?.straight || 70} />
              </div>
              <div className="lg:col-span-6 space-y-5">
                <ManhattanChart data={analytics?.manhattanData || match?.manhattanData || []} />
              </div>
            </div>
          )}

          {activeTab === 'pitchMap' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-5">
                <PitchMap deliveries={deliveries} pitchType={match?.stadium?.pitchType || 'Turning'} />
              </div>
              <div className="lg:col-span-7 space-y-5">
                <BowlingFigures bowlingFigures={analytics?.bowlingScorecard || match?.bowlingScorecard || []} />
              </div>
            </div>
          )}

          {activeTab === 'manhattan' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ManhattanChart data={analytics?.manhattanData || match?.manhattanData || []} />
              <RunRateGraph wormData={match?.wormData || []} targetScore={match?.targetScore} maxOvers={battingTeam.maxOvers} />
            </div>
          )}

          {activeTab === 'worm' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <WormChart
                wormData={match?.wormData || []}
                teamAName={match?.teamA?.name || 'Team A'}
                teamBName={match?.teamB?.name || 'Team B'}
                targetScore={match?.targetScore}
              />
              <RunRateGraph wormData={match?.wormData || []} targetScore={match?.targetScore} maxOvers={battingTeam.maxOvers} />
            </div>
          )}

          {activeTab === 'partnerships' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PartnershipGraph partnerships={analytics?.partnerships || match?.partnerships || []} />
              <FallOfWickets fallOfWickets={analytics?.fallOfWickets || match?.fallOfWickets || []} />
            </div>
          )}

          {activeTab === 'bowling' && (
            <div className="space-y-5">
              <BowlingFigures bowlingFigures={analytics?.bowlingScorecard || match?.bowlingScorecard || []} />
            </div>
          )}

          {activeTab === 'highlights' && (
            <div className="space-y-5">
              <MatchHighlights highlights={analytics?.highlights || match?.highlights || []} />
            </div>
          )}
        </div>

        {/* Match Summary Card Footer */}
        <MatchSummaryCard
          matchSummary={analytics?.matchSummary || match?.matchSummary}
          match={match}
        />
      </main>

      {/* Head-to-Head Player Comparison Modal */}
      <PlayerComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        matchId={matchId}
        playerList={[
          { _id: 'ply_01', name: striker.name },
          { _id: 'ply_02', name: bowler.name }
        ]}
      />

      {/* Bottom TV Ticker */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-wide">CRICKETVERSE TV</span>
          <span className="text-slate-600">•</span>
          <span>Pitch: <strong className="text-amber-400">{match?.stadium?.pitchType || 'Turning'}</strong></span>
          <span className="text-slate-600">•</span>
          <span>Weather: <strong className="text-cyan-400">{match?.weather?.condition || 'Clear'}</strong></span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <Link to={`/match/${matchId}`} className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
            Enter Match Center <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

