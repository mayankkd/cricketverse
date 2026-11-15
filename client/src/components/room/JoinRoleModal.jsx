import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  Shield,
  Trophy,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { sound } from '../../services/sound';

export const JoinRoleModal = ({
  room,
  inviteToken = null,
  onClose,
  onJoinSuccess
}) => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  const [selectedRole, setSelectedRole] = useState(null); // 'player' or 'spectator'
  const [teamName, setTeamName] = useState(user ? `${user.username}'s Super XI` : 'Bengaluru Challengers');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const activePlayers = room?.activePlayersCount ?? (room?.participants || []).filter(p => p.role === 'player').length;
  const spectatorsCount = room?.spectatorsCount ?? (room?.participants || []).filter(p => p.role === 'spectator').length;
  const isPlayerSlotsFull = activePlayers >= 6;
  const isSpectatorsAllowed = room?.allowSpectators !== false;
  const isPlayerJoiningAllowed = room?.allowPlayerJoining !== false;
  const requiresPassword = Boolean(room?.isPrivate || room?.invitation?.password);

  const handleJoin = async (roleToJoin) => {
    sound.playClick();
    setErrorMessage('');
    setLoading(true);

    const targetRole = roleToJoin || selectedRole;
    if (!targetRole) {
      setErrorMessage('Please select either JOIN AS PLAYER or JOIN AS SPECTATOR.');
      setLoading(false);
      return;
    }

    try {
      if (onJoinSuccess) {
        await onJoinSuccess({
          role: targetRole,
          teamName: targetRole === 'player' ? teamName : 'Spectator Dugout',
          password
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to join room.');
      if (err.code === 'PLAYER_SLOTS_FULL') {
        setSelectedRole('spectator');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-stadium-900 border border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stadium-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                {room?.format || 'T20'} ARENA PREVIEW
              </span>
              <span className="text-xs font-mono text-slate-400">
                Code: <strong className="text-white font-bold">{room?.roomCode}</strong>
              </span>
            </div>
            <h2 className="font-display text-2xl font-black uppercase text-white tracking-wide">
              {room?.name || 'Multiplayer Championship'}
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Host: <strong className="text-gold-400">{room?.hostUsername}</strong>
            </p>
          </div>

          {onClose && (
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-stadium-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Real-time Room Capacity Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-stadium-950 p-3.5 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Players</span>
            <span className={`font-display font-black text-2xl ${isPlayerSlotsFull ? 'text-red-400' : 'text-pitch-400'}`}>
              {activePlayers} / 6
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              {isPlayerSlotsFull ? 'SLOTS FULL' : `${6 - activePlayers} Available`}
            </span>
          </div>

          <div className="bg-stadium-950 p-3.5 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Min Required</span>
            <span className="font-display font-black text-2xl text-gold-400">
              2
            </span>
            <span className={`text-[10px] font-mono font-bold block mt-0.5 ${activePlayers >= 2 ? 'text-pitch-400' : 'text-amber-400'}`}>
              {activePlayers >= 2 ? '✓ ELIGIBLE TO START' : 'WAITING FOR 2ND'}
            </span>
          </div>

          <div className="bg-stadium-950 p-3.5 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Spectators</span>
            <span className="font-display font-black text-2xl text-electric-400">
              {spectatorsCount}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              Watching Live
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Explicit Role Selection (Two Cards) */}
        <div className="space-y-3">
          <label className="text-xs font-mono text-slate-300 font-bold uppercase block">
            Select Your Role in this Arena:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: JOIN AS PLAYER */}
            <div
              onClick={() => {
                if (!isPlayerSlotsFull && isPlayerJoiningAllowed) {
                  sound.playClick();
                  setSelectedRole('player');
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isPlayerSlotsFull || !isPlayerJoiningAllowed
                  ? 'bg-stadium-950/60 border-red-500/30 opacity-70 cursor-not-allowed'
                  : selectedRole === 'player'
                  ? 'bg-pitch-500/10 border-pitch-400 shadow-pitch-glow'
                  : 'bg-stadium-950 border-stadium-800 hover:border-stadium-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-pitch-500/20 border border-pitch-500/40 flex items-center justify-center text-pitch-400">
                  <Trophy className="w-5 h-5" />
                </div>
                {isPlayerSlotsFull ? (
                  <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full">
                    6/6 FULL
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold bg-pitch-500/20 text-pitch-400 border border-pitch-500/40 px-2 py-0.5 rounded-full">
                    {6 - activePlayers} SLOTS LEFT
                  </span>
                )}
              </div>

              <h3 className="font-display text-lg font-bold uppercase text-white">
                JOIN AS PLAYER
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Take command of a franchise, nominate players, place live bids in the mega auction, and lock playing XIs.
              </p>

              {isPlayerSlotsFull && (
                <div className="mt-3 pt-3 border-t border-red-500/20 text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>7th Person Rule: Slots full. Join as spectator below.</span>
                </div>
              )}
            </div>

            {/* OPTION 2: JOIN AS SPECTATOR */}
            <div
              onClick={() => {
                if (isSpectatorsAllowed) {
                  sound.playClick();
                  setSelectedRole('spectator');
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                !isSpectatorsAllowed
                  ? 'bg-stadium-950/60 border-slate-800 opacity-60 cursor-not-allowed'
                  : selectedRole === 'spectator'
                  ? 'bg-electric-500/10 border-electric-400 shadow-electric-glow'
                  : 'bg-stadium-950 border-stadium-800 hover:border-stadium-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-electric-500/20 text-electric-400 border border-electric-500/40 px-2 py-0.5 rounded-full">
                  UNLIMITED SEATS
                </span>
              </div>

              <h3 className="font-display text-lg font-bold uppercase text-white">
                JOIN AS SPECTATOR
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Watch live auction bids, inspect real player photos & 1–120 OVR cards, view match ball-by-ball commentary and worm graphs.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs conditional on selected role */}
        {selectedRole === 'player' && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase block font-bold">
              Your Franchise Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Bangalore Royal Titans"
              className="w-full bg-stadium-950 border border-pitch-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pitch-400 font-mono"
            />
          </div>
        )}

        {/* Password input if room is protected */}
        {requiresPassword && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase block font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gold-400" /> Room / Invitation Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full bg-stadium-950 border border-gold-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-gold-400 font-mono"
            />
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => handleJoin()}
          disabled={loading || !selectedRole}
          className={`w-full font-display uppercase font-bold text-xs py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl ${
            !selectedRole || loading
              ? 'bg-stadium-800 text-slate-500 cursor-not-allowed'
              : selectedRole === 'player'
              ? 'bg-pitch-500 hover:bg-pitch-400 text-slate-950 shadow-pitch-glow'
              : 'bg-electric-500 hover:bg-electric-400 text-slate-950 shadow-electric-glow'
          }`}
        >
          {loading ? (
            'AUTHENTICATING DUGOUT ACCESS...'
          ) : (
            <>
              CONFIRM & ENTER AS {selectedRole ? selectedRole.toUpperCase() : 'SELECTED ROLE'} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

