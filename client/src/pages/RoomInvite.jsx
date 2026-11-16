import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  Trophy,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  Shield,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { sound } from '../services/sound';

export const RoomInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, demoLogin, guestLogin } = useAuth();
  const { addToast } = useNotification();

  const [room, setRoom] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [teamName, setTeamName] = useState(user ? `${user.username}'s Super XI` : 'Bengaluru Challengers');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvitePreview = async () => {
      try {
        const res = await api.previewInvitation(token);
        if (res.success && res.room) {
          setRoom(res.room);
          // If player slots full, pre-select spectator
          if (res.room.activePlayersCount >= 6) {
            setSelectedRole('spectator');
          }
        } else {
          setError(res.message || 'Invitation link is invalid or expired.');
        }
      } catch (err) {
        setError(err.message || 'Could not verify invitation link.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitePreview();
  }, [token]);

  const handleJoin = async (roleToJoin) => {
    sound.playClick();
    const targetRole = roleToJoin || selectedRole;
    if (!targetRole) {
      addToast({ type: 'warning', message: 'Please select JOIN AS PLAYER or JOIN AS SPECTATOR.' });
      return;
    }

    let currentUser = user;
    const isCurrentHost = currentUser && room && (String(currentUser._id || currentUser.id) === String(room.hostId));

    if (!currentUser || (isCurrentHost && targetRole === 'player')) {
      try {
        const guestName = teamName ? teamName.replace(/\s*(XI|Super XI|Titans|Riders|Challengers)$/i, '').trim() : undefined;
        const guestRes = await guestLogin({
          username: guestName || undefined,
          teamName: targetRole === 'player' ? teamName : 'Spectator Dugout'
        });
        if (guestRes.success && guestRes.user) {
          currentUser = guestRes.user;
        }
      } catch {
        // Fallback to demo login if automatic guest session fails
        try {
          await demoLogin();
        } catch {
          localStorage.setItem('cricketverse_redirect', `/rooms/invite/${token}`);
          navigate(`/login?redirect=/rooms/invite/${token}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await api.joinByInvite(token, {
        role: targetRole,
        teamName: targetRole === 'player' ? teamName : 'Spectator Dugout',
        password
      });

      if (res.success && res.room) {
        addToast({
          type: 'success',
          title: 'ACCESS GRANTED',
          message: res.message || `Joined room as ${targetRole.toUpperCase()}`
        });
        navigate(`/rooms/${res.room.roomCode}`);
      } else {
        addToast({
          type: 'error',
          title: 'DUGOUT REJECTED',
          message: res.message || 'Could not join room'
        });
        if (res.code === 'PLAYER_SLOTS_FULL') {
          setSelectedRole('spectator');
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to enter arena.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handle1ClickDemo = async () => {
    sound.playClick();
    try {
      await demoLogin();
      addToast({
        type: 'success',
        title: 'DEMO MANAGER LOGGED IN',
        message: 'Proceeding with invitation...'
      });
    } catch {
      addToast({ type: 'error', message: 'Demo login failed.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="font-mono text-xs text-gold-400 uppercase tracking-widest">
          VALIDATING CRICKETVERSE INVITATION PASSKEY...
        </p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black uppercase text-white">
            INVITATION LINK INVALID
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-2 leading-relaxed">
            {error || 'This invitation link has either been revoked by the host, expired, or does not exist.'}
          </p>
        </div>
        <Link
          to="/rooms/join"
          className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-6 py-3 rounded-xl shadow-gold-glow"
        >
          BROWSE ACTIVE ROOMS <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const activePlayers = room.activePlayersCount ?? (room.participants || []).filter(p => p.role === 'player').length;
  const spectatorsCount = room.spectatorsCount ?? (room.participants || []).filter(p => p.role === 'spectator').length;
  const isPlayerSlotsFull = activePlayers >= 6;
  const isSpectatorsAllowed = room.allowSpectators !== false;
  const isPlayerJoiningAllowed = room.allowPlayerJoining !== false;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-stadium-900 via-stadium-850 to-gold-950/40 border border-gold-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase">
            EXCLUSIVE ARENA INVITATION
          </span>
          <span className="text-xs font-mono text-slate-400">
            Room: <strong className="text-white font-bold">{room.roomCode}</strong>
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
          {room.name}
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Host: <strong className="text-gold-400">{room.hostUsername}</strong> • Format: <strong className="text-white">{room.format}</strong> • Purse: <strong className="text-gold-300">{room.budgetPerTeam || (room.format === 'Test' ? 50 : room.format === 'ODI' ? 40 : 30)} Points</strong> per team
        </p>

        {/* Live Capacity Indicators */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stadium-800">
          <div className="bg-stadium-950 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Players</span>
            <span className={`font-display font-black text-xl ${isPlayerSlotsFull ? 'text-red-400' : 'text-pitch-400'}`}>
              {activePlayers} / 6
            </span>
          </div>
          <div className="bg-stadium-950 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Min Players</span>
            <span className="font-display font-black text-xl text-gold-400">2</span>
          </div>
          <div className="bg-stadium-950 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Spectators</span>
            <span className="font-display font-black text-xl text-electric-400">{spectatorsCount}</span>
          </div>
        </div>
      </div>

      {/* Guest Login Callout if user is not signed in */}
      {!user && (
        <div className="bg-stadium-900 border border-stadium-750 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-mono font-bold text-slate-300 block">
              You are currently viewing as a Guest
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Sign in to retain your franchise squad and record career stats.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handle1ClickDemo}
              className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> 1-CLICK DEMO LOGIN
            </button>
            <Link
              to={`/login?redirect=/rooms/invite/${token}`}
              className="bg-stadium-950 hover:bg-stadium-800 text-white font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl border border-stadium-700 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> LOGIN
            </Link>
          </div>
        </div>
      )}

      {/* Explicit Join Options (Two Cards) */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            CHOOSE YOUR ROLE
          </h2>
          <p className="text-xs font-mono text-slate-400">
            SELECT HOW YOU WILL PARTICIPATE IN THIS ARENA
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* OPTION 1: JOIN AS PLAYER */}
          <div
            onClick={() => {
              if (!isPlayerSlotsFull && isPlayerJoiningAllowed) {
                sound.playClick();
                setSelectedRole('player');
              }
            }}
            className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
              isPlayerSlotsFull || !isPlayerJoiningAllowed
                ? 'bg-stadium-950/60 border-red-500/30 opacity-70 cursor-not-allowed'
                : selectedRole === 'player'
                ? 'bg-pitch-500/10 border-pitch-400 shadow-pitch-glow'
                : 'bg-stadium-900 border-stadium-800 hover:border-stadium-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pitch-500/20 border border-pitch-500/40 flex items-center justify-center text-pitch-400">
                <Trophy className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isPlayerSlotsFull
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/40'
              }`}>
                {isPlayerSlotsFull ? 'SLOTS FULL (6/6)' : `${6 - activePlayers} SLOTS LEFT`}
              </span>
            </div>

            <h3 className="font-display text-xl font-bold uppercase text-white">
              JOIN AS PLAYER
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Take ownership of a franchise dugout, participate in live auction bidding wars, and command match tactics.
            </p>

            {isPlayerSlotsFull && (
              <div className="mt-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Seventh Person Rule: 6 active players are already joined. You can join as a spectator!</span>
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
            className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
              !isSpectatorsAllowed
                ? 'bg-stadium-950/60 border-slate-800 opacity-60 cursor-not-allowed'
                : selectedRole === 'spectator'
                ? 'bg-electric-500/10 border-electric-400 shadow-electric-glow'
                : 'bg-stadium-900 border-stadium-800 hover:border-stadium-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold bg-electric-500/20 text-electric-400 border border-electric-500/40 px-2 py-0.5 rounded-full">
                UNLIMITED SEATS
              </span>
            </div>

            <h3 className="font-display text-xl font-bold uppercase text-white">
              JOIN AS SPECTATOR
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Spectate live auction nominations and real-time bids, inspect authentic player photographs and 1–120 OVR cards, and follow live match commentary.
            </p>
          </div>
        </div>

        {/* Conditional Franchise Name */}
        {selectedRole === 'player' && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-mono text-slate-300 uppercase block font-bold">
              Franchise Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Bangalore Royal Titans"
              className="w-full bg-stadium-900 border border-pitch-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pitch-400 font-mono"
            />
          </div>
        )}

        {/* Conditional Password */}
        {room.requiresPassword && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-mono text-slate-300 uppercase block font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gold-400" /> Passcode Required
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full bg-stadium-900 border border-gold-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-gold-400 font-mono"
            />
          </div>
        )}

        {/* Enter Arena Button */}
        <button
          onClick={() => handleJoin()}
          disabled={submitting || !selectedRole}
          className={`w-full font-display uppercase font-bold text-xs py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl ${
            !selectedRole || submitting
              ? 'bg-stadium-800 text-slate-500 cursor-not-allowed'
              : selectedRole === 'player'
              ? 'bg-pitch-500 hover:bg-pitch-400 text-slate-950 shadow-pitch-glow'
              : 'bg-electric-500 hover:bg-electric-400 text-slate-950 shadow-electric-glow'
          }`}
        >
          {submitting ? (
            'ENTERING ARENA DUGOUT...'
          ) : (
            <>
              ENTER DUGOUT AS {selectedRole ? selectedRole.toUpperCase() : 'SELECTED ROLE'} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

