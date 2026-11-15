import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Shield,
  Zap,
  Users,
  Award,
  Crown,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRightLeft,
  Sliders,
  Edit3,
  Eye,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Shirt,
  Flame,
  Compass,
  Dumbbell
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FutCard } from '../components/common/FutCard';
import { PlayerProfileModal } from '../components/player/PlayerProfileModal';
import { PlayerComparisonModal } from '../components/team/PlayerComparisonModal';
import { SquadAnalyticsModal } from '../components/team/SquadAnalyticsModal';
import { EditTeamIdentityModal } from '../components/team/EditTeamIdentityModal';
import { ConfigureSquadLimitsModal } from '../components/team/ConfigureSquadLimitsModal';
import { TacticalManagementModal } from '../components/tactics/TacticalManagementModal';
import FranchiseLegacyTab from '../components/team/FranchiseLegacyTab';
import { PlayerDevelopmentModal } from '../components/player/PlayerDevelopmentModal';
import { TeamChemistryModal } from '../components/team/TeamChemistryModal';
import { OpponentScoutingModal } from '../components/scouting/OpponentScoutingModal';
import { sound } from '../services/sound';

export const TeamDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  // Team & Room State
  const [team, setTeam] = useState(null);
  const [roomTeams, setRoomTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [isSpectator, setIsSpectator] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lineup Selection State
  const [playingXIIds, setPlayingXIIds] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);
  const [wicketKeeperId, setWicketKeeperId] = useState(null);
  const [bowlingOrderIds, setBowlingOrderIds] = useState([]);
  const [activeFormat, setActiveFormat] = useState('t20');

  // Modals
  const [profileModalPlayer, setProfileModalPlayer] = useState(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [limitsModalOpen, setLimitsModalOpen] = useState(false);
  const [tacticsModalOpen, setTacticsModalOpen] = useState(false);
  // Phase 12 Modals
  const [devModalPlayer, setDevModalPlayer] = useState(null);
  const [chemistryModalOpen, setChemistryModalOpen] = useState(false);
  const [scoutingModalOpen, setScoutingModalOpen] = useState(false);

  // Swap bench target
  const [swapTargetPlayerId, setSwapTargetPlayerId] = useState(null);

  // Main Dashboard Tab: 'squad' | 'legacy'
  const [activeMainTab, setActiveMainTab] = useState('squad');

  // Load Team Data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    setRoomCode(code || '');

    const fetchTeamData = async () => {
      setLoading(true);
      try {
        let teamRes = null;
        if (code) {
          // If in a room, load franchise for this room
          teamRes = await api.getMyTeam({ room: code });
          // Also fetch all teams in room for franchise browser
          api.getTeamsByRoom(code).then(r => {
            if (r.success && r.teams) setRoomTeams(r.teams);
          }).catch(console.error);

          // Fetch room details for host & spectator checks
          api.getRoom(code).then(r => {
            if (r.success && r.room) {
              setRoomData(r.room);
              setIsHost(r.room.hostId === user?._id || r.room.hostUsername === user?.username);
              const p = (r.room.participants || []).find(part => part.userId === user?._id);
              if (p?.role === 'spectator') setIsSpectator(true);
            }
          }).catch(console.error);
        } else {
          teamRes = await api.getMyTeam();
        }

        if (teamRes?.success && teamRes.team) {
          applyTeamState(teamRes.team);
        }
      } catch (err) {
        console.error('Error fetching team:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user]);

  const applyTeamState = (t) => {
    setTeam(t);
    setSelectedTeamId(t._id);
    setPlayingXIIds(t.playingXI || (t.squad || []).slice(0, 11));
    setCaptainId(t.captainId || t.playingXI?.[0] || t.squad?.[0]);
    setViceCaptainId(t.viceCaptainId || t.playingXI?.[1] || t.squad?.[1]);
    setWicketKeeperId(t.wicketKeeperId || t.playingXI?.[2] || t.squad?.[2]);
    setBowlingOrderIds(t.bowlingOrder || []);
    setActiveFormat((t.format || 'T20').toLowerCase());
    if (t.isSpectator || t.isReadOnly) {
      setIsSpectator(true);
    }
  };

  // Switch viewing franchise in room
  const handleSwitchTeam = async (tId) => {
    sound.playClick();
    setSelectedTeamId(tId);
    try {
      const res = await api.getTeamById(tId);
      if (res.success && res.team) {
        applyTeamState(res.team);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move Batting Order Up
  const handleMoveUp = (index) => {
    if (isReadOnly || index === 0) return;
    sound.playClick();
    const newXI = [...playingXIIds];
    const temp = newXI[index - 1];
    newXI[index - 1] = newXI[index];
    newXI[index] = temp;
    setPlayingXIIds(newXI);
  };

  // Move Batting Order Down
  const handleMoveDown = (index) => {
    if (isReadOnly || index === playingXIIds.length - 1) return;
    sound.playClick();
    const newXI = [...playingXIIds];
    const temp = newXI[index + 1];
    newXI[index + 1] = newXI[index];
    newXI[index] = temp;
    setPlayingXIIds(newXI);
  };

  // Swap Bench Player with Selected Playing XI slot
  const handleSwapWithBench = async (benchPlayerId, targetXIPlayerId) => {
    if (isReadOnly) return;
    sound.playClick();
    try {
      const res = await api.swapTeamPlayer(team._id, {
        playerInId: benchPlayerId,
        playerOutId: targetXIPlayerId
      });
      if (res.success && res.team) {
        applyTeamState(res.team);
        setSwapTargetPlayerId(null);
        addToast({
          type: 'success',
          title: 'SUBSTITUTION COMPLETED',
          message: 'Tactical replacement updated in Playing XI!'
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'SWAP FAILED', message: err.message });
    }
  };

  // Save Lineup & Tactics to Server
  const handleSaveLineup = async () => {
    if (isReadOnly) return;
    sound.playGavelStrike();
    try {
      const res = await api.updateTeam(team._id, {
        playingXI: playingXIIds,
        battingOrder: playingXIIds,
        captainId,
        viceCaptainId,
        wicketKeeperId,
        bowlingOrder: bowlingOrderIds
      });

      if (res.success && res.team) {
        applyTeamState(res.team);
        addToast({
          type: 'success',
          title: 'LINEUP LOCKED & PERSISTED',
          message: 'Playing XI tactics, batting order, and captaincy saved successfully!'
        });
      }
    } catch (err) {
      sound.playWarningBeep();
      addToast({
        type: 'error',
        title: 'LINEUP REJECTED',
        message: err.message
      });
    }
  };

  // Save Branding
  const handleSaveBranding = async (brandingData) => {
    try {
      const res = await api.updateTeam(team._id, brandingData);
      if (res.success && res.team) {
        applyTeamState(res.team);
        addToast({
          type: 'success',
          title: 'BRANDING SAVED',
          message: 'Franchise team identity and jersey updated.'
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'UPDATE FAILED', message: err.message });
    }
  };

  // Configure Squad Limits (Host only)
  const handleSaveSquadLimits = async (limits) => {
    if (!roomCode) return;
    try {
      const res = await api.configureRoomSquadLimits(roomCode, limits);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'SQUAD LIMITS CONFIGURED',
          message: `Squad limits applied to all teams in room: Test (${limits.test}), ODI (${limits.odi}), T20 (${limits.t20}).`
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'CONFIG FAILED', message: err.message });
    }
  };

  const isReadOnly = isSpectator || (team?.ownerId !== user?._id && !isHost);

  // Populated lists from team
  const populatedSquad = team?.populatedSquad || [];
  const populatedXI = useMemo(() => {
    const map = new Map(populatedSquad.map(p => [p._id, p]));
    return playingXIIds.map((id, idx) => {
      const p = map.get(id);
      if (p) {
        return {
          ...p,
          battingOrderPosition: idx + 1,
          isCaptain: p._id === captainId,
          isViceCaptain: p._id === viceCaptainId,
          isWicketKeeper: p._id === wicketKeeperId,
          isBowlerAssigned: bowlingOrderIds.includes(p._id)
        };
      }
      return null;
    }).filter(Boolean);
  }, [populatedSquad, playingXIIds, captainId, viceCaptainId, wicketKeeperId, bowlingOrderIds]);

  const populatedBench = useMemo(() => {
    const xiSet = new Set(playingXIIds);
    return populatedSquad.filter(p => !xiSet.has(p._id));
  }, [populatedSquad, playingXIIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Spectator Mode Banner */}
      {isSpectator && (
        <div className="p-3.5 rounded-2xl bg-electric-500/10 border border-electric-500/40 text-electric-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-electric-400 flex-shrink-0" />
            <span>
              <strong>SPECTATOR READ-ONLY MODE:</strong> You are viewing franchise rosters, strengths, and player cards in observer mode. Editing tactics and lineups is disabled.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase bg-electric-500/20 px-2 py-0.5 rounded">
            Observer
          </span>
        </div>
      )}

      {/* Room Franchise Switcher Ribbon (if multiple franchises exist in room) */}
      {roomTeams.length > 1 && (
        <div className="bg-stadium-950 p-2.5 rounded-2xl border border-white/5 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold px-2 flex-shrink-0">
            Room Franchises:
          </span>
          {roomTeams.map((t) => (
            <button
              key={t._id}
              onClick={() => handleSwitchTeam(t._id)}
              className={`px-3 py-1.5 rounded-xl font-display uppercase font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors ${
                selectedTeamId === t._id
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'bg-stadium-900 border border-stadium-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{t.logo || '🏏'}</span> {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Team Header Card */}
      <div
        className="border p-6 rounded-3xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
        style={{
          backgroundColor: '#070b14',
          borderColor: team?.primaryColor ? `${team.primaryColor}66` : '#f59e0b66'
        }}
      >
        <div className="flex items-start gap-4">
          {/* Team Crest */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg border border-white/10 flex-shrink-0 relative overflow-hidden"
            style={{ backgroundColor: team?.secondaryColor || '#1E293B' }}
          >
            {team?.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <span>{team?.logo || '🏏'}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                FRANCHISE MANAGEMENT
              </span>
              <span className="bg-stadium-850 text-slate-300 text-xs font-mono font-bold px-2 py-0.5 rounded">
                SHORTCODE: {team?.shortCode || 'BRT'}
              </span>
              <span className="bg-pitch-500/10 text-pitch-400 text-xs font-mono font-bold px-2 py-0.5 rounded border border-pitch-500/30 uppercase">
                {team?.format || 'T20'} ARENA
              </span>
              {roomCode && (
                <span className="bg-stadium-850 text-slate-400 text-xs font-mono px-2 py-0.5 rounded">
                  ROOM: {roomCode}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
              {team?.name || `${user?.username}'s Super XI`}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Owner: <strong className="text-gold-400">{team?.ownerUsername || user?.username}</strong> • Total Squad: {populatedSquad.length} Players • Playing XI: 11
            </p>
          </div>
        </div>

        {/* Action Controls & Modal Triggers */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAnalyticsModalOpen(true)}
            className="bg-stadium-950 hover:bg-stadium-850 border border-white/10 text-slate-300 hover:text-white font-mono text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-gold-400" /> SQUAD ANALYTICS
          </button>

          <button
            onClick={() => setCompareModalOpen(true)}
            className="bg-stadium-950 hover:bg-stadium-850 border border-white/10 text-slate-300 hover:text-white font-mono text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" /> COMPARE PLAYERS
          </button>

          <button
            onClick={() => setTacticsModalOpen(true)}
            className="bg-stadium-950 hover:bg-stadium-850 border border-gold-500/40 text-gold-400 hover:text-white font-mono text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-gold-glow"
          >
            <Shield className="w-4 h-4 text-gold-400" /> TACTICAL SETUP
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setIdentityModalOpen(true)}
              className="bg-stadium-950 hover:bg-stadium-850 border border-white/10 text-slate-300 hover:text-white font-mono text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-amber-400" /> EDIT BRANDING
            </button>
          )}

          {isHost && (
            <button
              onClick={() => setLimitsModalOpen(true)}
              className="bg-stadium-950 hover:bg-stadium-850 border border-white/10 text-slate-300 hover:text-white font-mono text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-4 h-4 text-purple-400" /> SQUAD LIMITS
            </button>
          )}

          {!isReadOnly && (
            <button
              onClick={handleSaveLineup}
              className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-display font-black uppercase text-xs px-5 py-3 rounded-2xl shadow-gold-glow flex items-center gap-2 transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" /> LOCK PLAYING XI
            </button>
          )}
        </div>
      </div>

      {/* Squad Strength & Key Financial Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-stadium-900 border border-gold-500/30 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            SQUAD STRENGTH
          </span>
          <span className="font-display font-black text-2xl text-gold-400">
            {team?.squadStrength || team?.overallRating || 90}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Overall (1–120)</span>
        </div>

        <div className="bg-stadium-900 border border-amber-500/30 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            BATTING POWER
          </span>
          <span className="font-display font-black text-2xl text-amber-400">
            {team?.battingStrength || 85}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Top Order Weight</span>
        </div>

        <div className="bg-stadium-900 border border-cyan-500/30 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            BOWLING ATTACK
          </span>
          <span className="font-display font-black text-2xl text-cyan-400">
            {team?.bowlingStrength || 85}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Specialist Index</span>
        </div>

        <div className="bg-stadium-900 border border-pitch-500/30 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            FIELDING RATING
          </span>
          <span className="font-display font-black text-2xl text-pitch-400">
            {team?.fieldingStrength || 85}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Catching & Agility</span>
        </div>

        <div className="bg-stadium-900 border border-purple-500/30 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            CHEMISTRY SCORE
          </span>
          <span className="font-display font-black text-2xl text-purple-400">
            {team?.chemistryScore || 92}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Synergy Factor</span>
        </div>

        <div className="bg-stadium-900 border border-white/10 p-3.5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            TOTAL SPENT
          </span>
          <span className="font-display font-black text-2xl text-slate-200">
            {team?.totalSpending || 0} <span className="text-xs font-mono font-normal text-slate-500">PTS</span>
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Auction Outlay</span>
        </div>

        <div className="bg-stadium-900 border border-gold-500/40 p-3.5 rounded-2xl shadow-gold-glow">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            REMAINING PURSE
          </span>
          <span className="font-display font-black text-2xl text-gold-300">
            {team?.remainingPurse !== undefined ? team.remainingPurse : 30} <span className="text-xs font-mono font-normal text-gold-500">PTS</span>
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Available Points</span>
        </div>
      </div>

      {/* Tactical Squad Balance Pill */}
      <div className="p-3 bg-stadium-900 border border-stadium-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase font-bold">Lineup Balance:</span>
          <span className="text-gold-400 font-bold bg-gold-500/10 px-2 py-0.5 rounded">
            {team?.squadBalance?.summary || '11 Playing XI slots active'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>🏏 Batters: <strong className="text-white">{team?.squadBalance?.battersCount || 0}</strong></span>
          <span>🧤 Wicketkeepers: <strong className="text-white">{team?.squadBalance?.wicketKeepersCount || 0}</strong></span>
          <span>⚡ All-Rounders: <strong className="text-white">{team?.squadBalance?.allRoundersCount || 0}</strong></span>
          <span>🎯 Bowlers: <strong className="text-white">{team?.squadBalance?.bowlersCount || 0}</strong></span>
        </div>
      </div>

      {/* Main Playing XI Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-black uppercase text-white flex items-center gap-2">
              <Shirt className="w-6 h-6 text-gold-400" /> PLAYING XI BATTING ORDER (1 THROUGH 11)
            </h2>
            <p className="text-xs font-mono text-slate-400">
              ARRANGE BATTING ORDER • ASSIGN (C) CAPTAIN, (VC) VICE-CAPTAIN, (WK) WICKETKEEPER & BOWLING ROLES
            </p>
          </div>
          <span className="text-xs font-mono text-pitch-400 font-bold bg-pitch-500/10 border border-pitch-500/30 px-3 py-1 rounded-xl">
            {playingXIIds.length} / 11 SLOTS FILLED
          </span>
        </div>

        {/* 11 Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {populatedXI.map((player, index) => {
            const isCap = player._id === captainId;
            const isVC = player._id === viceCaptainId;
            const isWK = player._id === wicketKeeperId;
            const isBowler = bowlingOrderIds.includes(player._id);

            return (
              <div
                key={player._id}
                className="relative bg-stadium-950 p-2 rounded-3xl border border-white/5 hover:border-gold-500/40 transition-colors shadow-lg flex flex-col justify-between"
              >
                {/* Batting Position Badge & Badges Ribbon */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="bg-gold-500 text-slate-950 font-display font-black text-xs px-2.5 py-0.5 rounded-lg shadow-gold-glow">
                    #{index + 1} BAT
                  </span>

                  <div className="flex items-center gap-1 flex-wrap">
                    {isCap && (
                      <span className="bg-amber-400 text-slate-950 font-display font-black text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> (C)
                      </span>
                    )}
                    {isVC && (
                      <span className="bg-cyan-400 text-slate-950 font-display font-black text-[10px] px-1.5 py-0.5 rounded">
                        (VC)
                      </span>
                    )}
                    {isWK && (
                      <span className="bg-purple-400 text-slate-950 font-display font-black text-[10px] px-1.5 py-0.5 rounded">
                        (WK)
                      </span>
                    )}
                    {isBowler && (
                      <span className="bg-pitch-500 text-slate-950 font-display font-black text-[10px] px-1.5 py-0.5 rounded">
                        BWL
                      </span>
                    )}
                  </div>
                </div>

                {/* FUT Card View */}
                <div className="w-full">
                  <FutCard
                    player={player}
                    format={activeFormat}
                    compact={true}
                    onClick={() => setProfileModalPlayer(player)}
                  />
                </div>

                {/* Management Action Bar for this player */}
                {!isReadOnly && (
                  <div className="mt-3 space-y-1.5 border-t border-stadium-800 pt-2 text-[10px] font-mono">
                    {/* Batting Order Shift */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-slate-400 uppercase font-bold">Order:</span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                          className="p-1 rounded bg-stadium-900 hover:bg-stadium-800 disabled:opacity-30 text-slate-300"
                          title="Move up batting order"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={index === playingXIIds.length - 1}
                          onClick={() => handleMoveDown(index)}
                          className="p-1 rounded bg-stadium-900 hover:bg-stadium-800 disabled:opacity-30 text-slate-300"
                          title="Move down batting order"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Role Toggles: C, VC, WK, Bowler */}
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setCaptainId(player._id);
                        }}
                        className={`py-1 rounded font-bold uppercase transition-colors ${
                          isCap ? 'bg-gold-500 text-slate-950 font-black' : 'bg-stadium-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        (C)
                      </button>

                      <button
                        onClick={() => {
                          sound.playClick();
                          setViceCaptainId(player._id);
                        }}
                        className={`py-1 rounded font-bold uppercase transition-colors ${
                          isVC ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-stadium-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        (VC)
                      </button>

                      <button
                        onClick={() => {
                          sound.playClick();
                          setWicketKeeperId(player._id);
                        }}
                        className={`py-1 rounded font-bold uppercase transition-colors ${
                          isWK ? 'bg-purple-500 text-slate-950 font-black' : 'bg-stadium-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        (WK)
                      </button>

                      <button
                        onClick={() => {
                          sound.playClick();
                          if (isBowler) {
                            setBowlingOrderIds(bowlingOrderIds.filter(id => id !== player._id));
                          } else {
                            setBowlingOrderIds([...bowlingOrderIds, player._id]);
                          }
                        }}
                        className={`py-1 rounded font-bold uppercase transition-colors ${
                          isBowler ? 'bg-pitch-500 text-slate-950 font-black' : 'bg-stadium-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        BWL
                      </button>
                    </div>

                    {/* Phase 12: Train & Development Modal Trigger */}
                    <button
                      onClick={() => {
                        sound.playClick();
                        setDevModalPlayer(player);
                      }}
                      className="w-full py-1 rounded bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 text-amber-400 font-display font-bold text-[9px] uppercase flex items-center justify-center gap-1 transition-colors"
                    >
                      <Dumbbell className="w-3 h-3" /> TRAIN & DEV
                    </button>

                    {/* Bench Swap Selection */}
                    {populatedBench.length > 0 && (
                      <div className="pt-1">
                        {swapTargetPlayerId === player._id ? (
                          <div className="space-y-1">
                            <span className="text-[9px] text-amber-400 font-bold block">
                              Select Bench Player to swap in:
                            </span>
                            <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                              {populatedBench.map(bp => (
                                <button
                                  key={bp._id}
                                  onClick={() => handleSwapWithBench(bp._id, player._id)}
                                  className="p-1 rounded bg-pitch-900/40 hover:bg-pitch-900/80 border border-pitch-500/40 text-pitch-300 text-[9px] text-left truncate flex items-center justify-between"
                                >
                                  <span>{bp.name} ({bp.role})</span>
                                  <span className="font-bold">IN ↵</span>
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => setSwapTargetPlayerId(null)}
                              className="text-[9px] text-slate-500 hover:text-slate-300 underline block"
                            >
                              Cancel Swap
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSwapTargetPlayerId(player._id)}
                            className="w-full py-1 rounded bg-stadium-900 hover:bg-stadium-850 text-slate-400 hover:text-gold-300 flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Swap with Bench
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bench Reserves Section */}
      <div className="space-y-4 pt-6 border-t border-stadium-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-black uppercase text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> SQUAD BENCH RESERVES ({populatedBench.length})
            </h3>
            <p className="text-xs font-mono text-slate-400">
              TACTICAL SUBSTITUTES ACQUIRED IN AUCTION • READY FOR ROTATION
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Format Squad Limit: <strong className="text-white">{team?.squadLimits?.[activeFormat] || 13} Players</strong>
          </span>
        </div>

        {populatedBench.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stadium-950 border border-dashed border-stadium-800 text-center text-slate-500 font-mono text-xs">
            No bench reserve players. All squad members are in the Playing XI.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {populatedBench.map((player) => (
              <div
                key={player._id}
                className="bg-stadium-950 p-2 rounded-3xl border border-white/5 hover:border-cyan-500/40 transition-colors shadow-lg flex flex-col justify-between"
              >
                <div className="w-full">
                  <FutCard
                    player={player}
                    format={activeFormat}
                    compact={true}
                    onClick={() => setProfileModalPlayer(player)}
                  />
                </div>

                {!isReadOnly && (
                  <div className="mt-3 p-2 bg-stadium-900 rounded-xl border border-stadium-800 text-[10px] font-mono text-slate-400 space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">
                      Substitute into Playing XI:
                    </span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSwapWithBench(player._id, e.target.value);
                        }
                      }}
                      defaultValue=""
                      className="w-full bg-stadium-950 border border-stadium-700 rounded-lg p-1.5 text-slate-300 text-[10px] focus:outline-none focus:border-cyan-500"
                    >
                      <option value="" disabled>Replace player in XI...</option>
                      {populatedXI.map((xiP, i) => (
                        <option key={xiP._id} value={xiP._id}>
                          #{i + 1} {xiP.name} ({xiP.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

  {/* Player Profile Detail Modal */}
      {profileModalPlayer && (
        <PlayerProfileModal
          player={profileModalPlayer}
          onClose={() => setProfileModalPlayer(null)}
        />
      )}

      {/* Head-to-Head Compare Modal */}
      <PlayerComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        squad={populatedSquad}
        initialPlayer1={populatedXI[0]}
        initialPlayer2={populatedXI[1] || populatedBench[0]}
        activeFormat={activeFormat}
      />

      {/* Squad Analytics Modal */}
      <SquadAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        team={team}
        activeFormat={activeFormat}
      />

      {/* Edit Branding Modal */}
      <EditTeamIdentityModal
        isOpen={identityModalOpen}
        onClose={() => setIdentityModalOpen(false)}
        team={team}
        onSave={handleSaveBranding}
      />

      {/* Configure Squad Limits Modal (Host only) */}
      <ConfigureSquadLimitsModal
        isOpen={limitsModalOpen}
        onClose={() => setLimitsModalOpen(false)}
        currentLimits={team?.squadLimits || roomData?.squadLimits}
        onSave={handleSaveSquadLimits}
      />

      {/* Tactical Management Center Modal */}
      <TacticalManagementModal
        isOpen={tacticsModalOpen}
        onClose={() => setTacticsModalOpen(false)}
        teamId={team?._id}
        playingXI={populatedXI}
        format={team?.format || 'T20'}
        initialTactics={team?.tactics}
        isReadOnly={isReadOnly}
        onSaveSuccess={(newTactics) => {
          setTeam(prev => ({
            ...prev,
            tactics: newTactics
          }));
        }}
      />

      {/* Phase 12: Player Development & Training Modal */}
      {devModalPlayer && (
        <PlayerDevelopmentModal
          player={devModalPlayer}
          isOpen={Boolean(devModalPlayer)}
          onClose={() => setDevModalPlayer(null)}
          onUpdate={(updatedPlayer) => {
            setTeam(prev => {
              if (!prev) return prev;
              const newSquad = (prev.populatedSquad || []).map(p =>
                p._id === updatedPlayer._id ? { ...p, ...updatedPlayer } : p
              );
              return { ...prev, populatedSquad: newSquad };
            });
          }}
        />
      )}

      {/* Phase 12: Team Chemistry & Synergies Modal */}
      <TeamChemistryModal
        teamId={team?._id}
        isOpen={chemistryModalOpen}
        onClose={() => setChemistryModalOpen(false)}
      />

      {/* Phase 12: Opponent Analytical Scouting Modal */}
      <OpponentScoutingModal
        teamId={team?._id}
        opponentId={roomTeams.find(t => t._id !== team?._id)?._id || team?._id}
        isOpen={scoutingModalOpen}
        onClose={() => setScoutingModalOpen(false)}
      />
    </div>
  );
};
