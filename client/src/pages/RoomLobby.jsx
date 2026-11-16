import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Eye,
  Share2,
  Copy,
  Check,
  Send,
  Flame,
  Shield,
  Coins,
  Radio,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Trophy,
  Settings,
  Slash,
  AlertCircle,
  Sparkles,
  Wifi,
  WifiOff,
  UserX
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { socketService } from '../services/socket';
import { sound } from '../services/sound';
import { InviteFriendsModal } from '../components/room/InviteFriendsModal';
import { JoinRoleModal } from '../components/room/JoinRoleModal';
import { StadiumSelectorModal } from '../components/room/StadiumSelectorModal';
import { StadiumCard } from '../components/room/StadiumCard';
import { getShareableInviteUrl } from '../utils/inviteUrl';

export const RoomLobby = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRoleSelectModal, setShowRoleSelectModal] = useState(false);
  const [showStadiumModal, setShowStadiumModal] = useState(false);
  const [currentStadium, setCurrentStadium] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Host settings state
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [allowPlayerJoining, setAllowPlayerJoining] = useState(true);
  const [spectatorChatEnabled, setSpectatorChatEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRoom = async () => {
      try {
        const res = await api.getRoom(roomCode);
        if (res.success && res.room) {
          if (!mounted) return;
          setRoom(res.room);
          setAllowSpectators(res.room.allowSpectators !== false);
          setAllowPlayerJoining(res.room.allowPlayerJoining !== false);
          setSpectatorChatEnabled(res.room.spectatorChatEnabled !== false);

          if (res.room.stadium) {
            setCurrentStadium(res.room.stadium);
          } else {
            const stadRes = await api.getStadiumById(res.room.stadiumId || 'lords');
            if (stadRes.success && stadRes.stadium && mounted) {
              setCurrentStadium(stadRes.stadium);
            }
          }

          // Check if current user has joined
          const isParticipant = (res.room.participants || []).some(
            p => p.userId === user?._id || p.username === user?.username
          );
          if (!isParticipant && user) {
            setShowRoleSelectModal(true);
          }
        }
      } catch (err) {
        console.error('Error fetching room:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRoom();

    // Initialize Socket.io connection & event subscriptions
    socketService.joinRoom(roomCode, {
      role: 'player',
      teamName: user ? `${user.username}'s XI` : ''
    });

    const unsubRoomState = socketService.onRoomState((updatedRoom) => {
      if (mounted && updatedRoom) {
        setRoom(updatedRoom);
        if (updatedRoom.stadium) {
          setCurrentStadium(updatedRoom.stadium);
        }
      }
    });

    const unsubStadiumSelected = socketService.onStadiumSelected((data) => {
      if (mounted && data) {
        sound.playClick();
        if (data.stadium) {
          setCurrentStadium(data.stadium);
        }
        setRoom(prev => prev ? ({
          ...prev,
          stadiumId: data.stadiumId,
          stadium: data.stadium
        }) : prev);
        addToast({
          type: 'info',
          title: 'STADIUM SELECTED',
          message: `Match venue set to: ${data.stadium?.name || data.stadiumId}`
        });
      }
    });

    const unsubChat = socketService.onReceiveChat((newMsg) => {
      if (mounted) {
        setRoom((prev) => prev ? ({
          ...prev,
          chatMessages: [...(prev.chatMessages || []), newMsg]
        }) : prev);
      }
    });

    const unsubNotification = socketService.onNotification((notif) => {
      if (mounted) {
        addToast({
          type: 'info',
          title: notif.type || 'LOBBY UPDATE',
          message: notif.text
        });
      }
    });

    const unsubActionError = socketService.onActionError((err) => {
      if (mounted) {
        addToast({
          type: 'error',
          title: err.code || 'ACTION REJECTED',
          message: err.message
        });
      }
    });

    const unsubGameStarted = socketService.onGameStarted((startedRoom) => {
      if (mounted) {
        sound.playBidChime();
        addToast({
          type: 'success',
          title: 'ARENA LAUNCHED!',
          message: 'The auction has officially commenced. Entering arena...'
        });
        navigate(`/auction?room=${roomCode}`);
      }
    });

    const pollInterval = setInterval(() => {
      if (mounted) fetchRoom();
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      unsubRoomState();
      unsubStadiumSelected();
      unsubChat();
      unsubNotification();
      unsubActionError();
      unsubGameStarted();
    };
  }, [roomCode, user]);

  const activePlayers = (room?.participants || []).filter(p => p.role === 'player');
  const spectators = (room?.participants || []).filter(p => p.role === 'spectator');
  const currentParticipant = (room?.participants || []).find(
    p => p.userId === user?._id || p.username === user?.username
  );

  const isHost = currentParticipant?.isHost || room?.hostId === user?._id || room?.hostUsername === user?.username;
  const isSpectator = currentParticipant?.role === 'spectator';
  const isPlayer = currentParticipant?.role === 'player';
  const canStartGame = activePlayers.length >= 2;
  const availableSlots = Math.max(0, 6 - activePlayers.length);

  const inviteUrl = getShareableInviteUrl(room?.invitation?.token, roomCode);

  const handleCopyDirectInvite = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      addToast({
        type: 'success',
        title: 'INVITE LINK COPIED',
        message: 'Shareable invitation link copied to clipboard.'
      });
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to copy to clipboard.'
      });
    }
  };

  const handleToggleReady = async () => {
    sound.playClick();
    if (!room) return;
    if (isSpectator) {
      addToast({
        type: 'warning',
        message: 'Spectators do not have ready status.'
      });
      return;
    }
    try {
      const res = await api.toggleReady(roomCode);
      if (res.success && res.room) {
        setRoom(res.room);
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to toggle ready status.' });
    }
  };

  const handleStartArena = async () => {
    sound.playClick();
    if (!isHost) {
      addToast({ type: 'error', message: 'Only the host can launch the arena.' });
      return;
    }

    if (!canStartGame) {
      addToast({
        type: 'warning',
        title: 'CANNOT START',
        message: `At least 2 active players required (${activePlayers.length}/2). Spectators do not count toward player minimum.`
      });
      return;
    }

    try {
      const res = await api.startRoomGame(roomCode);
      if (res.success) {
        socketService.startGame(roomCode);
        sound.playBidChime();
        navigate(`/auction?room=${roomCode}`);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'START FAILED',
        message: err.message || 'Could not start arena.'
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (isSpectator && room?.spectatorChatEnabled === false) {
      addToast({
        type: 'warning',
        message: 'Spectator chat has been disabled by the room host.'
      });
      return;
    }

    sound.playClick();
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: user?.username || 'Visitor',
      senderRole: isHost ? 'host' : (currentParticipant?.role || 'spectator'),
      text: chatInput.trim(),
      timestamp: new Date()
    };

    setChatInput('');

    try {
      socketService.sendChat(roomCode, newMsg);
      await api.sendRoomChat(roomCode, newMsg.text);
    } catch {}
  };

  const handleKickParticipant = async (userId) => {
    sound.playClick();
    try {
      const res = await api.kickParticipant(roomCode, userId);
      if (res.success && res.room) {
        setRoom(res.room);
        addToast({ type: 'info', message: 'Participant removed from dugout.' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to remove participant.' });
    }
  };

  const handleSaveSettings = async () => {
    sound.playClick();
    try {
      const res = await api.updateRoomSettings(roomCode, {
        allowSpectators,
        allowPlayerJoining,
        spectatorChatEnabled
      });
      if (res.success && res.room) {
        setRoom(res.room);
        setShowSettingsModal(false);
        addToast({ type: 'success', message: 'Host settings updated.' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save settings.' });
    }
  };

  const handleJoinRoleConfirmed = async ({ role, teamName, password }) => {
    const res = await api.joinRoom(roomCode, { role, teamName, password });
    if (res.success && res.room) {
      setRoom(res.room);
      setShowRoleSelectModal(false);
      socketService.joinRoom(roomCode, { role, teamName });
      addToast({
        type: 'success',
        title: 'DUGOUT SECURED',
        message: `Successfully joined as ${role.toUpperCase()}.`
      });
    } else {
      throw new Error(res.message || 'Failed to join');
    }
  };

  if (loading || !room) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="font-mono text-xs text-gold-400 uppercase tracking-widest">
          SYNCING WITH ARENA DUGOUT CHANNELS...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-stadium-900 border border-stadium-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
              {room.format} ARENA
            </span>
            <span className="bg-stadium-950 text-slate-300 border border-white/10 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              Code: <strong className="text-white font-mono">{room.roomCode}</strong>
            </span>
            {isSpectator && (
              <span className="bg-electric-500/20 text-electric-400 border border-electric-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" /> SPECTATOR MODE ACTIVE
              </span>
            )}
            {isPlayer && (
              <span className="bg-pitch-500/20 text-pitch-400 border border-pitch-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Trophy className="w-3 h-3" /> ACTIVE FRANCHISE MANAGER
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            {room.name}
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Host: <strong className="text-gold-400">{room.hostUsername}</strong> • Format: <strong className="text-white">{room.format}</strong> • Purse: <strong className="text-gold-300">{room.budgetPerTeam || (room.format === 'Test' ? 50 : room.format === 'ODI' ? 40 : 30)} Points</strong> per team
          </p>

          {/* Shareable Invitation Link Bar with Quick Copy */}
          <div className="mt-3 flex items-center gap-2 max-w-lg bg-stadium-950/90 border border-gold-500/30 rounded-2xl p-1.5 px-3 shadow-inner">
            <span className="text-[10px] font-mono text-gold-400 uppercase font-bold shrink-0 flex items-center gap-1">
              <Share2 className="w-3 h-3" /> INVITE LINK:
            </span>
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent text-xs font-mono text-slate-300 flex-1 outline-none select-all truncate"
            />
            <button
              onClick={handleCopyDirectInvite}
              className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-gold-500 text-slate-950 hover:bg-gold-400 flex items-center gap-1 shrink-0 transition-transform active:scale-95 shadow-gold-glow"
              title="Copy shareable invitation link"
            >
              {copiedInvite ? <Check className="w-3.5 h-3.5 text-pitch-900" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedInvite ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Action Controls & Invite Button */}
        <div className="flex flex-wrap items-center gap-3">
          {isHost && (
            <button
              onClick={() => {
                sound.playClick();
                setShowStadiumModal(true);
              }}
              className="bg-stadium-950 hover:bg-stadium-850 text-gold-300 border border-gold-500/40 font-display uppercase font-bold text-xs px-4 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md"
            >
              <Shield className="w-4 h-4 text-gold-400" /> SELECT STADIUM
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              setShowInviteModal(true);
            }}
            className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-5 py-3 rounded-2xl shadow-gold-glow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Share2 className="w-4 h-4" /> INVITE FRIENDS
          </button>

          {isHost && (
            <button
              onClick={() => {
                sound.playClick();
                setShowSettingsModal(true);
              }}
              className="bg-stadium-950 hover:bg-stadium-850 text-slate-300 border border-stadium-750 font-display uppercase font-bold text-xs px-4 py-3 rounded-2xl flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4 text-gold-400" /> HOST SETTINGS
            </button>
          )}

          {!currentParticipant && (
            <button
              onClick={() => {
                sound.playClick();
                setShowRoleSelectModal(true);
              }}
              className="bg-pitch-500 hover:bg-pitch-400 text-slate-950 font-display uppercase font-bold text-xs px-5 py-3 rounded-2xl shadow-pitch-glow flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> JOIN DUGOUT
            </button>
          )}
        </div>
      </div>

      {/* Real-time Capacity Metrics Bar (Fixed 6-Player Capacity & Min 2 Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Active Players: X / 6 */}
        <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Active Players</span>
            <Users className="w-4 h-4 text-pitch-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-display font-black text-3xl ${activePlayers.length >= 6 ? 'text-red-400' : 'text-pitch-400'}`}>
              {activePlayers.length}
            </span>
            <span className="font-mono text-sm text-slate-500 font-bold">/ 6 MAX</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            {availableSlots === 0 ? '7th Person Rule: Slots full' : `${availableSlots} slots remaining`}
          </p>
        </div>

        {/* Minimum Players: 2 */}
        <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Minimum to Start</span>
            <Trophy className="w-4 h-4 text-gold-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-3xl text-gold-400">2</span>
            <span className="font-mono text-sm text-slate-500 font-bold">PLAYERS</span>
          </div>
          <p className="text-[10px] font-mono mt-1 font-bold">
            {canStartGame ? (
              <span className="text-pitch-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Eligible to Start
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Need {2 - activePlayers.length} more player
              </span>
            )}
          </p>
        </div>

        {/* Spectator Count */}
        <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Spectator Dugout</span>
            <Eye className="w-4 h-4 text-electric-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-3xl text-electric-400">
              {spectators.length}
            </span>
            <span className="font-mono text-sm text-slate-500 font-bold">SCOUTS</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Spectators never count toward min
          </p>
        </div>

        {/* Arena Status & Launch Controls */}
        <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Arena Status</span>
              <span className={`w-2.5 h-2.5 rounded-full ${canStartGame ? 'bg-pitch-400 animate-ping' : 'bg-amber-400'}`} />
            </div>
            <div className="font-display font-black text-xs uppercase mb-2">
              {canStartGame ? (
                <span className="text-pitch-400">READY TO LAUNCH</span>
              ) : (
                <span className="text-amber-400">WAITING FOR PLAYERS TO JOIN</span>
              )}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={handleStartArena}
              disabled={!canStartGame}
              className={`w-full font-display uppercase font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 ${
                canStartGame
                  ? 'bg-gold-500 hover:bg-gold-400 text-slate-950 shadow-gold-glow active:scale-95'
                  : 'bg-stadium-950 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              {canStartGame ? 'START AUCTION' : 'START AUCTION (MIN 2 PLAYERS)'}
            </button>
          ) : isSpectator ? (
            <div className="bg-electric-500/10 border border-electric-500/30 p-2 rounded-xl text-center text-[10px] font-mono text-electric-300 font-bold">
              👁 WATCHING ARENA LIVE
            </div>
          ) : (
            <button
              onClick={handleToggleReady}
              className={`w-full font-display uppercase font-bold text-xs py-2.5 rounded-xl transition-all ${
                currentParticipant?.isReady
                  ? 'bg-pitch-500 text-slate-950 shadow-pitch-glow'
                  : 'bg-stadium-950 text-slate-300 border border-stadium-750 hover:bg-stadium-800'
              }`}
            >
              {currentParticipant?.isReady ? '✓ READY' : 'SET AS READY'}
            </button>
          )}
        </div>
      </div>

      {/* Selected Match Stadium & Ground Conditions Banner */}
      <div className="bg-stadium-900 border border-stadium-800 p-5 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-24 h-16 rounded-2xl overflow-hidden bg-stadium-950 border border-white/10 flex-shrink-0 relative">
            {currentStadium?.imageUrl ? (
              <img
                src={currentStadium.imageUrl}
                alt={currentStadium.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏟️</div>
            )}
            <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-mono text-gold-400 px-1 rounded">
              {currentStadium?.pitchType || 'Pitch'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-gold-400 tracking-wider">
                MATCH VENUE & CONDITIONS
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                • {currentStadium?.city || 'London'}, {currentStadium?.country || 'England'}
              </span>
            </div>
            <h3 className="font-display font-black text-lg uppercase text-white leading-tight">
              {currentStadium?.fullName || currentStadium?.name || "Lord's Cricket Ground"}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-1 max-w-xl">
              {currentStadium?.boundaryDimensions?.description || 'Authentic venue with pitch effects influencing swing, spin, and boundaries.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {isHost ? (
            <button
              onClick={() => {
                sound.playClick();
                setShowStadiumModal(true);
              }}
              className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Shield className="w-3.5 h-3.5" />
              CHOOSE STADIUM ({currentStadium?.name || "Lord's"})
            </button>
          ) : (
            <div className="text-[11px] font-mono text-slate-400 bg-stadium-950 px-3 py-2 rounded-xl border border-stadium-800">
              Venue selected by Host
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Active Players, Spectator Dugout, and Comms Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Franchise Managers & Spectators */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Franchise Managers Section (Fixed Max 6) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold-400" />
                  ACTIVE FRANCHISE MANAGERS ({activePlayers.length} / 6)
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  QUALIFIED TO NOMINATE, BID & COMMAND LINEUPS
                </p>
              </div>

              {availableSlots > 0 && isSpectator && (
                <button
                  onClick={() => handleJoinRoleConfirmed({ role: 'player', teamName: `${user?.username || 'You'}'s XI` })}
                  className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-gold-glow flex items-center gap-1.5"
                >
                  UPGRADE TO PLAYER SLOT <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Active Player Cards */}
              {activePlayers.map((player, idx) => (
                <div
                  key={player.userId || idx}
                  className={`p-4 rounded-3xl border transition-all relative overflow-hidden ${
                    player.isReady
                      ? 'bg-stadium-900 border-pitch-500/50 shadow-pitch-glow'
                      : 'bg-stadium-900 border-stadium-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Connection Indicator Dot */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          player.isConnected !== false ? 'bg-pitch-400 shadow-pitch-glow' : 'bg-amber-400'
                        }`}
                        title={player.isConnected !== false ? 'Connected Online' : 'Disconnected (Slot Preserved)'}
                      />
                      <span className="font-display font-bold text-sm text-white truncate max-w-[120px]">
                        {player.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {player.isHost && (
                        <span className="bg-gold-500 text-slate-950 font-display font-bold text-[10px] px-2 py-0.5 rounded shadow-gold-glow flex items-center gap-0.5">
                          <Crown className="w-3 h-3" /> HOST
                        </span>
                      )}
                      {isHost && player.userId !== user?._id && (
                        <button
                          onClick={() => handleKickParticipant(player.userId)}
                          className="text-slate-500 hover:text-red-400 p-1"
                          title="Remove participant"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stadium-950 border border-white/5 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
                      <span>FRANCHISE</span>
                      <span className={`font-bold ${player.isReady ? 'text-pitch-400' : 'text-slate-400'}`}>
                        {player.isReady ? '✓ READY' : 'WAITING'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-white truncate text-xs">
                      {player.teamName}
                    </div>
                    <div className="text-[10px] font-mono text-gold-400">
                      Purse: {player.budgetRemaining !== undefined ? (player.budgetRemaining <= 100 ? `${player.budgetRemaining} PTS` : `₹${(player.budgetRemaining / 10000000).toFixed(1)} Cr`) : `${room.budgetPerTeam || 30} PTS`}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty Player Slot Placeholders up to 6 */}
              {Array.from({ length: availableSlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-5 rounded-3xl border border-dashed border-stadium-800 bg-stadium-950/40 flex flex-col items-center justify-center text-center space-y-1 min-h-[120px]"
                >
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                    Open Player Seat #{activePlayers.length + i + 1}
                  </span>
                  <span className="text-xs font-mono text-slate-600">
                    Awaiting Manager
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Spectator Dugout Section */}
          <div className="space-y-3 pt-4 border-t border-stadium-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-electric-400" />
                  SPECTATOR DUGOUT ({spectators.length} WATCHING)
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  VIEW-ONLY LIVE FEED OBSERVERS (UNLIMITED CAPACITY)
                </p>
              </div>

              {isPlayer && (
                <button
                  onClick={() => handleJoinRoleConfirmed({ role: 'spectator', teamName: 'Spectator Dugout' })}
                  className="text-xs font-mono text-slate-400 hover:text-white underline"
                >
                  Switch to Spectator
                </button>
              )}
            </div>

            {spectators.length === 0 ? (
              <div className="p-4 rounded-2xl bg-stadium-900 border border-stadium-800 text-center font-mono text-xs text-slate-500">
                No spectators currently in the gallery. Invite friends as observers!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {spectators.map((spec, idx) => (
                  <div
                    key={spec.userId || idx}
                    className="p-3 rounded-2xl bg-stadium-900 border border-stadium-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-electric-400 shadow-electric-glow flex-shrink-0" />
                      <span className="font-mono text-xs text-slate-200 truncate">
                        {spec.username}
                      </span>
                    </div>
                    {isHost && spec.userId !== user?._id && (
                      <button
                        onClick={() => handleKickParticipant(spec.userId)}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Remove spectator"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Dugout Live Comms / Chat */}
        <div className="bg-stadium-900 border border-stadium-800 p-5 rounded-3xl flex flex-col h-[560px] shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-stadium-800 mb-3">
            <div>
              <h3 className="font-display text-base font-bold uppercase text-white">DUGOUT COMMS</h3>
              <p className="text-[10px] font-mono text-pitch-400">MULTIPLAYER REAL-TIME CHAT</p>
            </div>
            <Radio className="w-4 h-4 text-pitch-400 animate-pulse" />
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {(room.chatMessages || []).map((msg) => {
              const isSys = msg.sender === 'System' || msg.senderRole === 'system';
              const isMine = msg.sender === user?.username;
              const isSpec = msg.senderRole === 'spectator';

              return (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-2xl text-xs ${
                    isSys
                      ? 'bg-stadium-950 border border-gold-500/20 text-gold-300 font-mono text-[11px]'
                      : isMine
                      ? 'bg-gold-500/10 border border-gold-500/30 text-white ml-4'
                      : 'bg-stadium-950 border border-stadium-800 text-slate-300 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-display font-bold text-[10px] uppercase text-slate-400 flex items-center gap-1">
                      {msg.senderRole === 'host' && (
                        <span className="bg-gold-500 text-slate-950 px-1 rounded text-[9px] font-black font-mono">
                          HOST
                        </span>
                      )}
                      {msg.senderRole === 'spectator' && (
                        <span className="bg-electric-500/20 text-electric-400 border border-electric-500/40 px-1 rounded text-[9px] font-mono">
                          SPECTATOR
                        </span>
                      )}
                      {msg.sender}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-stadium-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              disabled={isSpectator && room.spectatorChatEnabled === false}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                isSpectator && room.spectatorChatEnabled === false
                  ? 'Spectator chat disabled by host'
                  : 'Message managers & scouts...'
              }
              className="flex-1 bg-stadium-950 border border-stadium-750 disabled:opacity-50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 font-mono"
            />
            <button
              type="submit"
              disabled={isSpectator && room.spectatorChatEnabled === false}
              className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl shadow-gold-glow flex-shrink-0 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal
          room={room}
          isHost={isHost}
          onClose={() => setShowInviteModal(false)}
          onRoomUpdated={(updated) => setRoom(updated)}
        />
      )}

      {/* Role Selection Modal (For new visitors entering via code) */}
      {showRoleSelectModal && (
        <JoinRoleModal
          room={room}
          onClose={() => setShowRoleSelectModal(false)}
          onJoinSuccess={handleJoinRoleConfirmed}
        />
      )}

      {/* Host Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-stadium-900 border border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-stadium-800 pb-3">
              <h2 className="font-display text-xl font-bold uppercase text-white">
                HOST ARENA CONTROLS
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-stadium-950 border border-white/5 cursor-pointer">
                <div>
                  <span className="text-xs font-mono font-bold text-white block">Allow Spectators</span>
                  <span className="text-[10px] font-mono text-slate-400">Permit unassigned observers to watch arena</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowSpectators}
                  onChange={(e) => setAllowSpectators(e.target.checked)}
                  className="w-4 h-4 accent-gold-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-stadium-950 border border-white/5 cursor-pointer">
                <div>
                  <span className="text-xs font-mono font-bold text-white block">Allow Player Joining</span>
                  <span className="text-[10px] font-mono text-slate-400">Open seats for new active managers (up to 6)</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowPlayerJoining}
                  onChange={(e) => setAllowPlayerJoining(e.target.checked)}
                  className="w-4 h-4 accent-pitch-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-stadium-950 border border-white/5 cursor-pointer">
                <div>
                  <span className="text-xs font-mono font-bold text-white block">Spectator Chat Enabled</span>
                  <span className="text-[10px] font-mono text-slate-400">Allow spectators to send dugout messages</span>
                </div>
                <input
                  type="checkbox"
                  checked={spectatorChatEnabled}
                  onChange={(e) => setSpectatorChatEnabled(e.target.checked)}
                  className="w-4 h-4 accent-electric-500"
                />
              </label>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs py-3.5 rounded-2xl shadow-gold-glow"
            >
              APPLY SETTINGS
            </button>
          </motion.div>
        </div>
      )}

      {/* Stadium Selector Modal */}
      <StadiumSelectorModal
        isOpen={showStadiumModal}
        onClose={() => setShowStadiumModal(false)}
        roomCode={roomCode}
        isHost={isHost}
        currentStadiumId={room.stadiumId || 'lords'}
        onStadiumConfirmed={(stad) => setCurrentStadium(stad)}
      />
    </div>
  );
};
