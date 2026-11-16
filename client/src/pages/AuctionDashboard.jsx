import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel,
  Flame,
  Clock,
  Coins,
  Shield,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Zap,
  Volume2,
  Dices,
  History,
  Eye,
  RefreshCw,
  Plus,
  Users,
  Trophy,
  Award,
  Radio,
  Layers,
  ChevronRight,
  ExternalLink,
  Home,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FutCard } from '../components/common/FutCard';
import { socketService } from '../services/socket';
import { sound } from '../services/sound';
import { T2VetoModal } from '../components/auction/T2VetoModal';
import { AuctionReplayModal } from '../components/auction/AuctionReplayModal';
import { AuctionAwardsModal } from '../components/auction/AuctionAwardsModal';

export const AuctionDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  // Room & Auction State
  const [roomCode, setRoomCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [auctionState, setAuctionState] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [isSpectator, setIsSpectator] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState(null);

  // Active Lot & Bidding
  const [currentLot, setCurrentLot] = useState(null);
  const [currentBid, setCurrentBid] = useState(1);
  const [highestBidder, setHighestBidder] = useState('Starting Price (Uncontested)');
  const [highestBidderTeam, setHighestBidderTeam] = useState(null);
  const [highestBidderId, setHighestBidderId] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isSold, setIsSold] = useState(false);
  const [isVetoed, setIsVetoed] = useState(false);

  // User Purse & Veto Tokens
  const [formatPurse, setFormatPurse] = useState(30);
  const [userPurse, setUserPurse] = useState(30);
  const [vetoTokens, setVetoTokens] = useState(2);

  // Modals
  const [nominationOpen, setNominationOpen] = useState(false);
  const [vetoModalOpen, setVetoModalOpen] = useState(false);
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [awardsModalOpen, setAwardsModalOpen] = useState(false);
  const [dramaticOverlay, setDramaticOverlay] = useState(null);
  const [soldAnnouncement, setSoldAnnouncement] = useState(null);
  const [bottomTab, setBottomTab] = useState('squads'); // 'squads' | 'participants' | 'sold'
  const [selectedTeamUserId, setSelectedTeamUserId] = useState(null);

  const timerRef = useRef(null);

  // Format purse helper
  const getPurseForFormat = (fmt) => {
    const f = (fmt || '').toUpperCase();
    if (f === 'TEST') return 50;
    if (f === 'ODI') return 40;
    return 30;
  };

  // 1. Initial Load: Fetch room, players, and auction state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room') || 'IPL-2026';
    setRoomCode(code);

    // Fetch Player Database
    api.getPlayers().then((res) => {
      if (res.success && res.players) {
        setAllPlayers(res.players);
      }
    }).catch(console.error);

    // Fetch Room & Auction State
    const loadRoomData = async () => {
      setIsLoadingRoom(true);
      setRoomError(null);
      try {
        const res = await api.getRoom(code);
        if (res.success && res.room) {
          const room = res.room;
          setRoomData(room);
          const initialP = getPurseForFormat(room.format);
          setFormatPurse(initialP);

          // Find current user's participant record
          const p = (room.participants || []).find(
            part => part.userId === user?._id || part.username === user?.username
          );

          if (p) {
            setIsSpectator(p.role === 'spectator');
            setUserPurse(p.budgetRemaining !== undefined ? p.budgetRemaining : initialP);
            setVetoTokens(p.t2VetoTokens !== undefined ? p.t2VetoTokens : 2);
          } else {
            setIsSpectator(false);
            setUserPurse(initialP);
            setVetoTokens(2);
          }

          setIsHost(room.hostId === user?._id || room.hostUsername === user?.username);

          // Auction state sync
          if (room.auctionState) {
            syncAuctionState(room.auctionState);
          }
        } else {
          setRoomError(res?.message || `Room with code '${code}' not found.`);
        }
      } catch (err) {
        console.warn('Could not load specific room, operating in sandbox mode:', err.message);
        setRoomError(err.message || `Unable to load room '${code}'.`);
      } finally {
        setIsLoadingRoom(false);
      }
    };

    loadRoomData();

    // Socket.io Real-time connection
    socketService.joinRoom(code, {
      role: isSpectator ? 'spectator' : 'player',
      teamName: user ? `${user.username}'s XI` : 'Franchise'
    });

    const unsubGameStarted = socketService.onGameStarted((startedRoom) => {
      if (startedRoom) {
        setRoomData(startedRoom);
        if (startedRoom.auctionState) {
          syncAuctionState(startedRoom.auctionState);
        }
        addToast({
          type: 'gold',
          title: 'AUCTION ARENA LAUNCHED!',
          message: 'The host has launched the live mega auction!'
        });
      }
    });

    // Listeners
    const unsubRoom = socketService.onRoomState((updated) => {
      if (updated) {
        setRoomData(updated);
        const me = (updated.participants || []).find(p => p.userId === user?._id);
        if (me) {
          setUserPurse(me.budgetRemaining);
          setVetoTokens(me.t2VetoTokens);
          setIsSpectator(me.role === 'spectator');
        }
        if (updated.auctionState) {
          syncAuctionState(updated.auctionState);
        }
      }
    });

    const unsubAuction = socketService.onAuctionState((state) => {
      if (state) syncAuctionState(state);
    });

    const unsubBid = socketService.onBidUpdated((bidData) => {
      if (bidData) {
        sound.playBidChime();
        setCurrentBid(bidData.amount);
        setHighestBidder(bidData.username || 'Manager');
        setHighestBidderTeam(bidData.teamName || null);
        setHighestBidderId(bidData.userId || null);
        setTimeLeft(15);
        if (bidData.bidHistory) {
          setBidHistory(bidData.bidHistory);
        } else {
          setBidHistory(prev => [
            {
              id: `bid_${Date.now()}`,
              bidderUsername: bidData.username,
              bidderTeam: bidData.teamName,
              amount: bidData.amount,
              timestamp: new Date()
            },
            ...prev
          ]);
        }
      }
    });

    const unsubNominated = socketService.onPlayerNominated((lot) => {
      if (lot) {
        sound.playGavelStrike();
        setCurrentLot(lot);
        setCurrentBid(lot.currentBid || lot.startingPrice || 1);
        setHighestBidder(lot.highestBidderUsername || 'Starting Price (Uncontested)');
        setHighestBidderTeam(lot.highestBidderTeam || null);
        setHighestBidderId(lot.highestBidderId || null);
        const rem = lot.timerExpiresAt
          ? Math.max(0, Math.round((new Date(lot.timerExpiresAt) - Date.now()) / 1000))
          : (lot.timerRemaining || 15);
        setTimeLeft(rem);
        setIsSold(false);
        setIsVetoed(false);
        setBidHistory([]);
        addToast({
          type: 'gold',
          title: 'NEXT CRICKETER ON BLOCK',
          message: `${lot.playerName} (${lot.cardVariant}) on the block at 1 point starting price!`
        });
      }
    });

    const unsubVeto = socketService.onT2VetoActivated((data) => {
      sound.playWicketFall();
      setIsVetoed(true);
      setDramaticOverlay({
        title: '⚡ T2 VETO ACTIVATED!',
        message: `${data.vetoedBy} played a T2 Veto token on ${data.lot?.playerName || 'the player'}. Cricketer is eliminated!`,
        color: 'red'
      });
      setTimeout(() => setDramaticOverlay(null), 4000);
      addToast({
        type: 'error',
        title: 'T2 VETO PLAYED',
        message: `${data.vetoedBy} eliminated ${data.lot?.playerName} from this auction!`
      });
    });

    const unsubHammer = socketService.onLotHammered((data) => {
      handleLotResolution(data.lot);
      if (data.participants) {
        setRoomData(prev => prev ? { ...prev, participants: data.participants } : prev);
        const me = data.participants.find(p => p.userId === user?._id);
        if (me) {
          setUserPurse(me.budgetRemaining !== undefined ? me.budgetRemaining : userPurse);
          setVetoTokens(me.t2VetoTokens !== undefined ? me.t2VetoTokens : vetoTokens);
        }
      }
    });

    const unsubSquads = socketService.onSquadsUpdated((data) => {
      if (data?.participants) {
        setRoomData(prev => prev ? { ...prev, participants: data.participants } : prev);
        const me = data.participants.find(p => p.userId === user?._id);
        if (me) {
          setUserPurse(me.budgetRemaining !== undefined ? me.budgetRemaining : userPurse);
          setVetoTokens(me.t2VetoTokens !== undefined ? me.t2VetoTokens : vetoTokens);
        }
      }
    });

    const unsubError = socketService.onActionError((err) => {
      sound.playWarningBeep();
      addToast({
        type: 'error',
        title: 'ACTION REJECTED',
        message: err.message
      });
    });

    const socket = socketService.getSocket();
    const handleTimerTick = (data) => {
      if (data && data.timerRemaining !== undefined) {
        setTimeLeft(data.timerRemaining);
      }
    };
    socket.on('auction_timer_tick', handleTimerTick);

    const handleAuctionCompleted = () => {
      sound.playBidChime();
      addToast({
        type: 'gold',
        title: 'MEGA AUCTION COMPLETED!',
        message: 'All franchise rosters finalized. Proceed to match day!'
      });
    };
    socket.on('auction_completed', handleAuctionCompleted);

    return () => {
      unsubGameStarted();
      unsubRoom();
      unsubAuction();
      unsubBid();
      unsubNominated();
      unsubVeto();
      unsubHammer();
      unsubSquads();
      unsubError();
      socket.off('auction_timer_tick', handleTimerTick);
      socket.off('auction_completed', handleAuctionCompleted);
    };
  }, [user]);

  // Synchronize auction state helper
  const syncAuctionState = (state) => {
    setAuctionState(state);
    if (state.currentLot) {
      setCurrentLot(state.currentLot);
      setCurrentBid(state.currentLot.currentBid || state.currentLot.startingPrice || 1);
      setHighestBidder(state.currentLot.highestBidderUsername || 'Starting Price (Uncontested)');
      setHighestBidderTeam(state.currentLot.highestBidderTeam || null);
      setHighestBidderId(state.currentLot.highestBidderId || null);
      setIsSold(state.currentLot.status === 'sold');
      setIsVetoed(state.currentLot.status === 'vetoed');
      if (state.currentLot.timerExpiresAt) {
        const remaining = Math.max(0, Math.round((new Date(state.currentLot.timerExpiresAt) - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else if (state.currentLot.timerRemaining) {
        setTimeLeft(state.currentLot.timerRemaining);
      }
    }
    if (state.bidHistory) {
      setBidHistory(state.bidHistory);
    }
  };

  // Countdown Timer with Anti-Sniping
  useEffect(() => {
    if (isSold || isVetoed || !currentLot || currentLot.status !== 'nominated') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleHammerDown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentLot, isSold, isVetoed]);

  // Gavel down resolution
  const handleHammerDown = async () => {
    if (isSold || isVetoed || !currentLot) return;
    try {
      socketService.hammerLot(roomCode);
      const res = await api.hammerAuctionLot(roomCode);
      if (res.success && res.currentLot) {
        handleLotResolution(res.currentLot);
      }
    } catch (err) {
      console.warn('Hammer resolution fallback:', err.message);
      // Local fallback
      setIsSold(true);
      if (highestBidderId) {
        sound.playSixHit();
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
        addToast({
          type: 'gold',
          title: 'HAMMER DOWN! SOLD!',
          message: `${currentLot.playerName} sold to ${highestBidder} for ${currentBid} points!`
        });
      } else {
        addToast({
          type: 'info',
          title: 'HAMMER DOWN! UNSOLD',
          message: `${currentLot.playerName} went unsold at 1 point.`
        });
      }
    }
  };

  const handleLotResolution = (lot) => {
    if (!lot) return;
    if (lot.status === 'sold') {
      setIsSold(true);
      sound.playSixHit();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setSoldAnnouncement({
        playerName: lot.playerName,
        playerImage: lot.playerImage,
        country: lot.country,
        role: lot.role,
        cardVariant: lot.cardVariant,
        ovr: typeof lot.ovr === 'object' ? (lot.ovr.t20 || 90) : lot.ovr,
        buyerTeam: lot.highestBidderTeam || 'Franchise',
        buyerUsername: lot.highestBidderUsername || 'Manager',
        finalPrice: lot.currentBid || 1
      });
      setTimeout(() => setSoldAnnouncement(null), 6000);
      addToast({
        type: 'gold',
        title: 'HAMMER DOWN! SOLD!',
        message: `${lot.playerName} sold to ${lot.highestBidderUsername} (${lot.highestBidderTeam}) for ${lot.currentBid} points!`
      });
    } else if (lot.status === 'unsold') {
      setIsSold(true);
      addToast({
        type: 'info',
        title: 'HAMMER DOWN! UNSOLD',
        message: `${lot.playerName} went unsold at 1 point starting price.`
      });
    } else if (lot.status === 'vetoed') {
      setIsVetoed(true);
    }
  };

  // Live bidding action
  const handlePlaceBid = async (incrementPoints = 1) => {
    if (isSpectator) {
      sound.playWarningBeep();
      addToast({
        type: 'warning',
        title: 'SPECTATOR MODE ACTIVE',
        message: 'Spectators cannot place bids. Bidding is strictly reserved for active franchise managers.'
      });
      return;
    }

    if (!currentLot || currentLot.status !== 'nominated') {
      addToast({ type: 'error', title: 'NO ACTIVE LOT', message: 'No cricketer is currently up for auction.' });
      return;
    }

    if (highestBidderId === user?._id) {
      addToast({ type: 'warning', title: 'CANNOT OUTBID SELF', message: 'You already hold the highest bid!' });
      return;
    }

    const nextAmount = highestBidderId ? (currentBid + incrementPoints) : 1;

    if (nextAmount > userPurse) {
      sound.playWarningBeep();
      addToast({
        type: 'error',
        title: 'PURSE EXCEEDED',
        message: `Bid of ${nextAmount} points exceeds your remaining purse of ${userPurse} points!`
      });
      return;
    }

    // Submit bid
    socketService.placeBid(roomCode, {
      amount: nextAmount,
      username: user?.username || 'Franchise Manager',
      teamName: user ? `${user.username}'s XI` : 'Manager XI',
      userId: user?._id
    });

    try {
      const res = await api.placeAuctionBid(roomCode, { amount: nextAmount });
      if (res.success && res.currentLot) {
        setCurrentBid(res.currentLot.currentBid);
      }
    } catch (err) {
      console.warn('Bid HTTP fallback:', err.message);
    }
  };

  // T2 Veto execution
  const handleExecuteT2Veto = async () => {
    if (isSpectator) {
      sound.playWarningBeep();
      addToast({
        type: 'warning',
        title: 'SPECTATOR MODE ACTIVE',
        message: 'Spectators cannot use T2 Veto tokens.'
      });
      return;
    }

    if (vetoTokens <= 0) {
      sound.playWarningBeep();
      addToast({
        type: 'error',
        title: 'NO VETO TOKENS',
        message: 'You have exhausted your 2 T2 Veto tokens for this auction.'
      });
      return;
    }

    try {
      socketService.useT2Veto(roomCode, {
        userId: user?._id,
        username: user?.username
      });

      const res = await api.useT2Veto(roomCode);
      if (res.success) {
        setVetoTokens(res.remainingTokens !== undefined ? res.remainingTokens : Math.max(0, vetoTokens - 1));
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'VETO REJECTED',
        message: err.message
      });
    }
  };

  // Nomination execution
  const handleNominatePlayer = async (player) => {
    try {
      socketService.nominatePlayer(roomCode, player);
      const res = await api.nominatePlayer(roomCode, {
        cardId: player._id,
        playerId: player.playerId || player._id
      });
      if (res.success && res.currentLot) {
        setCurrentLot(res.currentLot);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'NOMINATION REJECTED',
        message: err.message
      });
    }
  };

  // Random nomination execution
  const handleNominateRandom = async () => {
    try {
      const res = await api.nominateRandomAuctionPlayer(roomCode);
      if (res.success && res.currentLot) {
        setCurrentLot(res.currentLot);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'RANDOM NOMINATION FAILED',
        message: err.message
      });
    }
  };

  // Launch auction from waiting screen (Host only)
  const handleStartAuction = async () => {
    try {
      sound.playGavelStrike();
      const res = await api.startRoomGame(roomCode);
      if (res.success) {
        socketService.startGame(roomCode);
        if (res.room) {
          setRoomData(res.room);
          if (res.room.auctionState) {
            syncAuctionState(res.room.auctionState);
          }
        }
        addToast({
          type: 'gold',
          title: 'MEGA AUCTION LAUNCHED',
          message: 'The gavel block is open and the randomized cricketer queue is rolling!'
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'COULD NOT START AUCTION',
        message: err.message || 'Failed to start auction arena.'
      });
    }
  };

  // Commence Unsold Round (Host only)
  const handleStartUnsoldRound = async () => {
    try {
      sound.playGavelStrike();
      const res = await api.startUnsoldRound(roomCode);
      if (res.success) {
        addToast({
          type: 'gold',
          title: 'UNSOLD ROUND COMMENCED',
          message: 'Eligible unsold cricketers are now re-activated for nomination. Vetoed cricketers remain permanently barred.'
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'ERROR', message: err.message });
    }
  };

  // Active turn calculation
  const isMyTurn = useMemo(() => {
    if (!auctionState || auctionState.nominationMode !== 'rotating') return true;
    if (!auctionState.turnOrder || auctionState.turnOrder.length === 0) return true;
    const currentUserId = auctionState.turnOrder[auctionState.currentTurnIndex % auctionState.turnOrder.length];
    return currentUserId === user?._id;
  }, [auctionState, user]);

  const currentTurnUserName = useMemo(() => {
    if (!auctionState?.turnOrder?.length) return 'Open';
    const currentUserId = auctionState.turnOrder[auctionState.currentTurnIndex % auctionState.turnOrder.length];
    const p = (roomData?.participants || []).find(part => part.userId === currentUserId);
    return p?.username || 'Manager';
  }, [auctionState, roomData]);

  // Active players and spectators lists
  const activeParticipants = useMemo(() => {
    return (roomData?.participants || []).filter(p => p.role === 'player');
  }, [roomData]);

  const spectatorParticipants = useMemo(() => {
    return (roomData?.participants || []).filter(p => p.role === 'spectator');
  }, [roomData]);

  const currentViewedTeam = useMemo(() => {
    if (!activeParticipants.length) return null;
    if (selectedTeamUserId) {
      const found = activeParticipants.find(p => p.userId === selectedTeamUserId);
      if (found) return found;
    }
    const myTeam = activeParticipants.find(p => p.userId === user?._id);
    return myTeam || activeParticipants[0];
  }, [activeParticipants, selectedTeamUserId, user]);

  // Screen 1: Loading Screen
  if (isLoadingRoom) {
    return (
      <div className="min-h-screen bg-stadium-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-4 shadow-gold-glow animate-pulse">
          <Gavel className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="font-display font-black text-2xl uppercase tracking-wider text-white">
          ENTERING THE HAMMER ARENA
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-2">
          Synchronizing room <span className="text-gold-400 font-bold">{roomCode}</span> with authoritative MongoDB ledger...
        </p>
      </div>
    );
  }

  // Screen 2: Error Screen
  if (roomError && !roomData) {
    return (
      <div className="min-h-screen bg-stadium-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stadium-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase text-white tracking-wide">
            ROOM NOT AVAILABLE
          </h1>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            {roomError}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 shadow-gold-glow"
            >
              <RefreshCw className="w-4 h-4" /> RETRY
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-stadium-950 hover:bg-stadium-850 text-slate-300 font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl border border-stadium-700 flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" /> HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Auction Not Started Yet Screen
  const isAuctionUnstarted = roomData && roomData.status === 'waiting' && (!auctionState || auctionState.status === 'idle');
  if (isAuctionUnstarted) {
    const activeCount = (roomData.participants || []).filter(p => p.role === 'player').length;
    const canStart = activeCount >= (roomData.minPlayers || 2);

    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-gradient-to-r from-stadium-950 via-stadium-900 to-amber-950/40 border border-gold-500/40 p-8 rounded-3xl shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400 mx-auto shadow-gold-glow">
            <Gavel className="w-8 h-8" />
          </div>
          <div>
            <span className="bg-gold-500/20 text-gold-300 border border-gold-500/40 font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              AUCTION WAITING ROOM
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl uppercase text-white tracking-wide mt-3">
              {roomData.name || 'CRICKETVERSE ARENA'}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              ROOM CODE: <strong className="text-gold-400">{roomCode}</strong> • FORMAT: <strong className="text-white">{roomData.format}</strong> ({formatPurse} PTS PURSE)
            </p>
          </div>

          <div className="bg-stadium-950/80 border border-white/10 rounded-2xl p-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-400">ACTIVE PLAYERS</span>
              <span className="text-gold-400 font-bold">{activeCount} / {roomData.maxPlayers || 6}</span>
            </div>
            <div className="w-full bg-stadium-900 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-gold-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (activeCount / (roomData.maxPlayers || 6)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-2">
              {canStart
                ? 'Minimum player threshold reached. Host can start the auction!'
                : `Need at least ${roomData.minPlayers || 2} players to begin. Currently awaiting more managers.`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isHost ? (
              <button
                onClick={handleStartAuction}
                disabled={!canStart}
                className="bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-display uppercase font-black text-sm px-6 py-3.5 rounded-xl shadow-gold-glow transition-transform active:scale-95 flex items-center gap-2"
              >
                <Gavel className="w-5 h-5 fill-current" /> START AUCTION NOW
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-pitch-500/10 border border-pitch-500/30 text-pitch-300 font-mono text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-pitch-400" />
                Waiting for host (@{roomData.hostUsername}) to launch the auction...
              </div>
            )}
            <button
              onClick={() => window.location.href = `/lobby?room=${roomCode}`}
              className="bg-stadium-950 hover:bg-stadium-850 text-slate-300 font-display uppercase font-bold text-xs px-5 py-3.5 rounded-xl border border-white/10"
            >
              GO TO LOBBY
            </button>
          </div>
        </div>

        {/* Participants Dugout */}
        <div className="bg-stadium-900 border border-stadium-800 rounded-3xl p-6">
          <h3 className="font-display font-bold uppercase text-white text-sm mb-4">
            CONNECTED MANAGERS & SPECTATORS ({roomData.participants?.length || 0})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(roomData.participants || []).map((p) => (
              <div
                key={p.userId}
                className="bg-stadium-950 border border-white/5 p-3 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="font-display font-bold text-xs text-white block">
                    {p.teamName || `${p.username}'s XI`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    @{p.username} {p.isHost && '(Host)'}
                  </span>
                </div>
                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                  p.role === 'player'
                    ? 'bg-pitch-500/20 text-pitch-300 border-pitch-500/40'
                    : 'bg-electric-500/20 text-electric-300 border-electric-500/40'
                }`}>
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative">
      {/* Dramatic Overlay for Veto / Alerts */}
      <AnimatePresence>
        {dramaticOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-red-950/90 backdrop-blur-xl pointer-events-none"
          >
            <div className="text-center space-y-3 max-w-lg">
              <ShieldAlert className="w-20 h-20 text-red-400 mx-auto animate-bounce" />
              <h2 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-wider text-white">
                {dramaticOverlay.title}
              </h2>
              <p className="font-mono text-sm text-red-200">
                {dramaticOverlay.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spectator Mode Banner */}
      {isSpectator && (
        <div className="p-3.5 rounded-2xl bg-electric-500/10 border border-electric-500/40 text-electric-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-electric-400 flex-shrink-0" />
            <span>
              <strong>SPECTATOR MODE ACTIVE:</strong> You have an uninterrupted view of the gavel, player photographs, OVR ratings, bids, and sale outcomes. Action controls are view-only.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase bg-electric-500/20 px-2 py-0.5 rounded">
            Observer
          </span>
        </div>
      )}

      {/* Auction Stage Header */}
      <div className="bg-gradient-to-r from-stadium-950 via-stadium-900 to-amber-950/40 border border-gold-500/40 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="flex items-center gap-1.5 bg-red-600 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              <Flame className="w-3.5 h-3.5" /> LIVE MEGA AUCTION
            </span>
            <span className="bg-gold-500/10 border border-gold-500/30 text-xs font-mono text-gold-400 font-bold px-2 py-0.5 rounded">
              FORMAT: {roomData?.format || 'T20'} ({formatPurse} PTS PURSE)
            </span>
            <span className="bg-stadium-850 text-xs font-mono text-slate-300 font-bold px-2 py-0.5 rounded">
              ROOM: {roomCode}
            </span>
            {auctionState?.unsoldRoundActive && (
              <span className="bg-pitch-500/20 text-pitch-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-pitch-500/40 uppercase">
                UNSOLD ROUND ACTIVE
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            THE HAMMER ARENA
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            ALL CARDS START AT EXACTLY 1 POINT • 1 CRICKETER ONLY ONCE PER AUCTION • 2 T2 VETO TOKENS
          </p>
        </div>

        {/* Manager Live Purse & Veto Tokens Indicator */}
        <div className="flex items-center gap-3">
          {/* T2 Veto Status Card */}
          <div className="bg-stadium-950 p-4 rounded-2xl border border-red-500/30 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                T2 VETO TOKENS
              </span>
              <span className="font-display font-black text-xl text-red-400">
                {vetoTokens} / 2
              </span>
            </div>
          </div>

          {/* Remaining Purse Card */}
          <div className="bg-stadium-950 p-4 rounded-2xl border border-gold-500/40 shadow-gold-glow flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                REMAINING PURSE
              </span>
              <span className="font-display font-black text-2xl text-gold-300">
                {userPurse} <span className="text-sm font-mono font-normal text-gold-500">PTS</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Action Ribbon: Automatic Random Queue Status & Modals */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stadium-900 border border-stadium-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-pitch-500/20 text-pitch-300 font-mono text-xs font-bold px-3 py-1.5 rounded-xl border border-pitch-500/40">
            <Sparkles className="w-4 h-4 text-pitch-400" />
            AUTOMATIC RANDOM NOMINATION
          </span>
          <span className="text-xs font-mono text-slate-400 bg-stadium-950 px-3 py-1.5 rounded-xl border border-white/5">
            Queue Lot: <strong className="text-gold-400">{(auctionState?.queueIndex !== undefined ? auctionState.queueIndex + 1 : 1)}</strong>
            {auctionState?.auctionQueueLength ? ` of ${auctionState.auctionQueueLength}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setReplayModalOpen(true)}
            className="bg-stadium-950 hover:bg-stadium-850 border border-white/10 text-slate-300 hover:text-white font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-gold-400" /> REPLAY & LOGS
          </button>

          <button
            onClick={() => setAwardsModalOpen(true)}
            className="bg-stadium-950 hover:bg-stadium-850 border border-gold-500/30 text-gold-300 hover:text-gold-200 font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> AUCTION AWARDS
          </button>
        </div>
      </div>

      {/* SOLD Celebration Announcement Banner */}
      <AnimatePresence>
        {soldAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-r from-gold-950 via-stadium-950 to-amber-950 border-2 border-gold-400 p-5 rounded-3xl shadow-gold-glow flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden border-2 border-gold-400 bg-stadium-900 flex-shrink-0 shadow-lg">
                {soldAnnouncement.playerImage ? (
                  <img
                    src={soldAnnouncement.playerImage}
                    alt={soldAnnouncement.playerName}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold-400 font-bold">🏏</div>
                )}
                <span className="absolute bottom-0 right-0 bg-black/90 font-mono text-[9px] text-gold-400 font-bold px-1 rounded-tl">
                  {soldAnnouncement.ovr} OVR
                </span>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-gold-400">
                  <Gavel className="w-3.5 h-3.5 text-gold-400" /> OFFICIAL SALE ANNOUNCEMENT: SOLD!
                </span>
                <h2 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                  {soldAnnouncement.playerName}
                </h2>
                <p className="text-xs font-mono text-slate-300 mt-0.5">
                  Role: <strong className="text-pitch-400">{soldAnnouncement.role}</strong> • Variant: <strong className="text-gold-400">{soldAnnouncement.cardVariant}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col md:items-end text-center md:text-right bg-stadium-900/80 border border-gold-500/30 px-5 py-3 rounded-2xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                PURCHASED BY FRANCHISE
              </span>
              <span className="font-display font-black text-lg text-white">
                {soldAnnouncement.buyerTeam}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Manager: <strong className="text-pitch-300">{soldAnnouncement.buyerUsername}</strong>
              </span>
              <div className="mt-1.5 font-display font-black text-xl text-gold-400">
                🔨 {soldAnnouncement.finalPrice} <span className="text-xs font-mono text-gold-500">PTS</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Auction Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Player Stage & FUT Card (1 Col) */}
        <div className="flex flex-col items-center justify-center bg-stadium-900 border border-stadium-800 p-6 rounded-3xl relative">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">
              CURRENT GAVEL LOT
            </span>
            <span className="text-xs font-mono text-pitch-400 font-bold bg-pitch-500/10 px-2 py-0.5 rounded">
              STARTING PRICE: 1 POINT
            </span>
          </div>

          {currentLot && (currentLot.cardId || currentLot.playerId || currentLot.playerName || currentLot.name) ? (
            <div className="w-full max-w-xs relative">
              {isVetoed && (
                <div className="absolute inset-0 z-20 bg-red-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 text-center border-2 border-red-500">
                  <ShieldAlert className="w-16 h-16 text-red-500 mb-2 animate-pulse" />
                  <span className="font-display font-black text-2xl text-red-400 uppercase">
                    T2 VETOED
                  </span>
                  <span className="text-xs font-mono text-red-200 mt-1">
                    Cricketer permanently eliminated from this auction.
                  </span>
                </div>
              )}

              {isSold && (
                <div className="absolute inset-0 z-20 bg-stadium-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 text-center border-2 border-gold-400">
                  <Gavel className="w-14 h-14 text-gold-400 mb-2" />
                  <span className="font-display font-black text-2xl text-gold-400 uppercase">
                    HAMMER DOWN: SOLD!
                  </span>
                  <span className="text-xs font-mono text-white mt-1">
                    Won by {highestBidder} for {currentBid} pts
                  </span>
                </div>
              )}

              <FutCard
                player={{
                  name: currentLot.playerName || currentLot.name || 'Cricketer',
                  shortName: currentLot.shortName || currentLot.playerName || currentLot.name || 'CR',
                  role: currentLot.role || 'Batter',
                  country: currentLot.country || 'India',
                  countryFlag: currentLot.countryFlag || '🏏',
                  cardVariant: currentLot.cardVariant || 'Peak',
                  overallRating: typeof currentLot.ovr === 'object' ? (currentLot.ovr.t20 || 90) : (currentLot.ovr || 90),
                  ovr: currentLot.ovr,
                  imageUrl: currentLot.playerImage || currentLot.imageUrl || currentLot.avatarUrl,
                  avatarUrl: currentLot.playerImage || currentLot.imageUrl || currentLot.avatarUrl,
                  basePrice: currentLot.startingPrice || 1,
                  battingStyle: currentLot.battingStyle || 'Right-hand bat',
                  bowlingStyle: currentLot.bowlingStyle || 'Right-arm medium fast'
                }}
                compact={false}
              />

              {/* Batting and Bowling Styles Info Display */}
              <div className="mt-3 w-full bg-stadium-950/90 border border-white/10 rounded-xl p-2.5 text-center text-xs font-mono text-slate-300 shadow-inner">
                <div className="flex items-center justify-around">
                  <span>🏏 <strong className="text-white">Bat:</strong> {currentLot.battingStyle || 'Right-hand bat'}</span>
                  <span className="text-slate-600">•</span>
                  <span>⚡ <strong className="text-white">Bowl:</strong> {currentLot.bowlingStyle || 'Right-arm medium fast'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center border-2 border-dashed border-stadium-800 rounded-2xl text-center p-6 text-slate-500">
              <Gavel className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="font-display font-bold uppercase text-slate-400 text-sm">
                Preparing Auction Lot
              </p>
              <p className="text-xs font-mono mt-1">
                The auctioneer is presenting the next cricketer from the randomized queue...
              </p>
            </div>
          )}

          {/* Post-lot automatic progression banner */}
          {(isSold || isVetoed) && (
            <div className="mt-4 w-full text-center p-3 rounded-xl bg-pitch-950/50 border border-pitch-500/30 animate-pulse">
              <span className="text-xs font-mono text-pitch-300 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-pitch-400" />
                {isSold
                  ? `SOLD to ${highestBidder}! Presenting next cricketer automatically...`
                  : 'VETOED! Presenting next cricketer automatically...'}
              </span>
            </div>
          )}

          {/* Auction Completed Banner */}
          {(auctionState?.status === 'completed' || auctionState?.stage === 'AUCTION_COMPLETED') && (
            <div className="mt-4 w-full text-center p-4 rounded-xl bg-gold-950/60 border border-gold-500/50 shadow-gold-glow">
              <span className="font-display font-black text-sm text-gold-300 uppercase block mb-1">
                🏆 AUCTION COMPLETED
              </span>
              <p className="text-[11px] font-mono text-slate-300 mb-3">
                All franchise rosters are finalized. Head over to squad management to configure your Playing XI!
              </p>
              <button
                onClick={() => window.location.href = `/teams?room=${roomCode}`}
                className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 font-display font-bold uppercase text-xs py-2.5 rounded-lg shadow-gold-glow transition-transform active:scale-95"
              >
                PROCEED TO SQUAD MANAGEMENT
              </button>
            </div>
          )}
        </div>

        {/* Middle: Live Bid Control Console & T2 Veto (1 Col) */}
        <div className="bg-stadium-900 border border-gold-500/30 p-6 rounded-3xl space-y-6 shadow-xl">
          {/* Hammer Countdown Clock */}
          <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 text-center">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase text-red-400">
                <Clock className="w-4 h-4" /> HAMMER CLOCK
              </span>
              <span className="font-bold">{timeLeft}s REMAINING</span>
            </div>

            {/* Countdown Bar */}
            <div className="w-full bg-stadium-900 h-3 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className={`h-full rounded-full transition-all duration-300 ${
                  timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-gold-500'
                }`}
                style={{ width: `${(timeLeft / 15) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Top Bid Standout Display */}
          <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-stadium-950 to-stadium-850 border border-gold-500/40 shadow-gold-glow">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
              CURRENT HIGHEST BID
            </span>
            <span className="font-display font-black text-4xl sm:text-5xl text-gold-400 tracking-tight block my-1">
              {currentBid} <span className="text-lg font-mono text-gold-500">POINTS</span>
            </span>
            <span className="text-xs font-mono text-slate-300 font-bold block mt-1">
              Leader: <span className="text-pitch-400">{highestBidder}</span>
              {highestBidderTeam && <span className="text-slate-400"> ({highestBidderTeam})</span>}
            </span>
          </div>

          {/* Interactive Bidding Increment Buttons */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-2">
              RAISE BID INCREMENT
            </span>
            {isSpectator ? (
              <div className="p-4 rounded-2xl bg-electric-500/10 border border-electric-500/30 text-electric-300 text-xs font-mono text-center leading-relaxed">
                <span className="font-bold block uppercase mb-1">👁 Spectator Mode Active</span>
                You are observing the gavel live. Live bidding is reserved for active franchise managers.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '+1 Point', inc: 1 },
                  { label: '+2 Points', inc: 2 },
                  { label: '+5 Points', inc: 5 },
                  { label: '+10 Points', inc: 10 }
                ].map((btn, i) => (
                  <button
                    key={i}
                    disabled={isSold || isVetoed || !currentLot || currentLot.status !== 'nominated'}
                    onClick={() => handlePlaceBid(btn.inc)}
                    className="bg-stadium-950 hover:bg-gold-500 hover:text-slate-950 border border-gold-500/40 text-gold-300 font-display font-bold uppercase text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" /> {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* T2 VETO ACTION BUTTON */}
          {!isSpectator && (
            <div className="pt-3 border-t border-stadium-800">
              <button
                disabled={
                  isSold ||
                  isVetoed ||
                  vetoTokens <= 0 ||
                  !currentLot ||
                  currentLot.status !== 'nominated'
                }
                onClick={() => setVetoModalOpen(true)}
                className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-display font-black uppercase text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <ShieldAlert className="w-4 h-4" /> PLAY T2 VETO TOKEN ({vetoTokens}/2 REMAINING)
              </button>
              <p className="text-[10px] font-mono text-slate-500 text-center mt-1.5">
                Veto immediately eliminates the cricketer from this entire auction.
              </p>
            </div>
          )}
        </div>

        {/* Right: Live Gavel Feed (1 Col) */}
        <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-stadium-800 mb-3">
            <h3 className="font-display text-base font-bold uppercase text-white">LIVE GAVEL FEED</h3>
            <span className="text-[10px] font-mono text-gold-400 font-bold">REAL-TIME LOGS</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
            {bidHistory.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-mono text-xs">
                Waiting for opening bids...
              </div>
            ) : (
              bidHistory.map((b) => (
                <div
                  key={b.id || Math.random()}
                  className="p-3 rounded-xl bg-stadium-950 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-display font-bold text-white block truncate max-w-[140px]">
                      {b.bidderUsername || b.manager || 'Manager'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {b.bidderTeam || 'Franchise'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-black text-sm text-gold-400">
                      {b.amount} PTS
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Room Stats Footer */}
          <div className="mt-4 pt-3 border-t border-stadium-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Sold: {auctionState?.soldLots?.length || 0}</span>
            <span>Unsold: {auctionState?.unsoldLots?.length || 0}</span>
            <span>Vetoed: {auctionState?.vetoedLots?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MULTIPLAYER SYNCHRONIZED SECTIONS: SQUADS, SOLD, PARTICIPANTS */}
      {/* ============================================================== */}
      <div className="bg-stadium-900 border border-stadium-800 rounded-3xl p-6 space-y-6 shadow-2xl">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stadium-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBottomTab('squads')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold uppercase text-xs transition-all ${
                bottomTab === 'squads'
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'bg-stadium-950 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              FRANCHISE SQUADS ({activeParticipants.length})
            </button>

            <button
              onClick={() => setBottomTab('sold')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold uppercase text-xs transition-all ${
                bottomTab === 'sold'
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'bg-stadium-950 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Trophy className="w-4 h-4" />
              RECENTLY SOLD ({auctionState?.soldLots?.length || 0})
            </button>

            <button
              onClick={() => setBottomTab('participants')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold uppercase text-xs transition-all ${
                bottomTab === 'participants'
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'bg-stadium-950 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Radio className="w-4 h-4 text-pitch-400" />
              LIVE PARTICIPANTS ({roomData?.participants?.length || 0})
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pitch-400 animate-ping" />
            MongoDB Authoritative Sync Active
          </span>
        </div>

        {/* TAB 1: FRANCHISE SQUADS */}
        {bottomTab === 'squads' && (
          <div className="space-y-6">
            {/* Team Selector Ribbon */}
            <div className="flex flex-wrap items-center gap-2 pb-2 overflow-x-auto">
              {activeParticipants.map((p) => {
                const isSelected = (currentViewedTeam?.userId === p.userId);
                const squadCount = (p.squad || []).length;
                const maxSquad = roomData?.format === 'T20' ? 13 : 15;
                return (
                  <button
                    key={p.userId}
                    onClick={() => setSelectedTeamUserId(p.userId)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-stadium-950 border-gold-400 text-gold-300 shadow-md ring-1 ring-gold-400/50'
                        : 'bg-stadium-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold font-display text-white">{p.teamName}</span>
                    <span className="text-[10px] bg-stadium-850 px-2 py-0.5 rounded text-slate-400">
                      {squadCount}/{maxSquad} Players
                    </span>
                    <span className="text-[10px] text-gold-400 font-bold">
                      {p.budgetRemaining !== undefined ? p.budgetRemaining : formatPurse} pts
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Currently Selected Team Header & Cards */}
            {currentViewedTeam ? (
              <div className="bg-stadium-950 border border-white/5 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stadium-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-xl text-white">
                        {currentViewedTeam.teamName}
                      </h3>
                      {currentViewedTeam.isHost && (
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40">
                          HOST
                        </span>
                      )}
                      {currentViewedTeam.userId === user?._id && (
                        <span className="bg-pitch-500/20 text-pitch-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-pitch-500/40">
                          YOUR TEAM
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Manager: <strong className="text-slate-200">@{currentViewedTeam.username}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="bg-stadium-900 border border-gold-500/30 px-3.5 py-1.5 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">PURSE REMAINING</span>
                      <strong className="text-gold-300 text-sm font-display">
                        {currentViewedTeam.budgetRemaining !== undefined ? currentViewedTeam.budgetRemaining : formatPurse} PTS
                      </strong>
                    </div>

                    <div className="bg-stadium-900 border border-white/10 px-3.5 py-1.5 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">SPENT</span>
                      <strong className="text-slate-200 text-sm font-display">
                        {(currentViewedTeam.squad || []).reduce((sum, s) => sum + (s.acquiredPrice || 0), 0)} PTS
                      </strong>
                    </div>

                    <div className="bg-stadium-900 border border-white/10 px-3.5 py-1.5 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">SQUAD</span>
                      <strong className="text-pitch-400 text-sm font-display">
                        {(currentViewedTeam.squad || []).length} / {roomData?.format === 'T20' ? 13 : 15}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Squad Cards Grid */}
                {(currentViewedTeam.squad || []).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-stadium-850 rounded-xl text-slate-500 font-mono text-xs">
                    <Gavel className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-bounce" />
                    No cricketers acquired yet. Place winning bids on the gavel block to sign players!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(currentViewedTeam.squad || []).map((card, idx) => {
                      const cardObj = typeof card === 'string'
                        ? (allPlayers.find(p => p._id === card || p.playerId === card) || { _id: card, name: card, playerName: card, role: 'Batter', ovr: 85, acquiredPrice: 1 })
                        : (card || {});
                      const playerName = cardObj.playerName || cardObj.name || 'Cricketer';
                      const role = cardObj.role || 'Batter';
                      const roleBadgeColor = {
                        Batter: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                        Bowler: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                        'All-Rounder': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                        Wicketkeeper: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      }[role] || 'bg-slate-700 text-slate-300 border-slate-600';

                      const ovrVal = typeof cardObj.ovr === 'object' ? (cardObj.ovr.t20 || 90) : (cardObj.ovr || cardObj.overallRating || 90);
                      const playerImg = cardObj.playerImage || cardObj.imageUrl || cardObj.avatarUrl;

                      return (
                        <div
                          key={cardObj.cardId || cardObj._id || `${cardObj.playerId || 'card'}_${idx}`}
                          className="bg-stadium-900 border border-gold-500/20 hover:border-gold-400/60 rounded-xl p-2.5 flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group"
                        >
                          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-stadium-950 mb-2 border border-white/5">
                            {playerImg ? (
                              <img
                                src={playerImg}
                                alt={playerName}
                                className="w-full h-full object-cover object-top"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🏏</div>
                            )}
                            <span className="absolute top-1 right-1 bg-black/80 font-mono font-bold text-[9px] text-gold-400 px-1 py-0.5 rounded">
                              {ovrVal}
                            </span>
                          </div>

                          <div>
                            <span className="font-display font-bold text-xs text-white truncate block">
                              {playerName}
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${roleBadgeColor}`}>
                                {typeof role === 'string' ? role.substring(0, 4).toUpperCase() : 'PLAY'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-gold-400">
                                {cardObj.acquiredPrice || 1} PTS
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: RECENTLY SOLD CRICKETERS */}
        {bottomTab === 'sold' && (
          <div>
            {(auctionState?.soldLots || []).length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-stadium-850 rounded-2xl text-slate-500 font-mono text-xs">
                <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                No cricketers sold yet. Active lots in the Hammer Arena will appear here once hammered!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(auctionState?.soldLots || []).map((sold, idx) => {
                  const lot = sold.lot || sold || {};
                  const lotName = lot.playerName || lot.name || 'Cricketer';
                  const ovrVal = typeof lot.ovr === 'object' ? (lot.ovr.t20 || 90) : (lot.ovr || 90);
                  const lotImg = lot.playerImage || lot.imageUrl || lot.avatarUrl;
                  return (
                    <div
                      key={sold.id || idx}
                      className="bg-stadium-950 border border-gold-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-md hover:border-gold-400 transition-colors"
                    >
                      <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-stadium-900 border border-gold-500/40 flex-shrink-0">
                        {lotImg ? (
                          <img
                            src={lotImg}
                            alt={lotName}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🏏</div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-black/90 font-mono text-[8px] text-gold-400 px-1 rounded-tl">
                          {ovrVal}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-display font-bold text-sm text-white truncate block">
                          {lotName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          {lot.country || ''} {lot.role ? `• ${lot.role}` : ''}
                        </span>
                        <div className="mt-1 flex items-center justify-between text-xs font-mono">
                          <span className="text-pitch-300 font-bold truncate max-w-[120px]">
                            {sold.buyerTeam || 'Franchise'}
                          </span>
                          <span className="text-gold-400 font-bold font-display">
                            {sold.finalPrice || lot.currentBid || 1} PTS
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE PARTICIPANTS & DUGOUT */}
        {bottomTab === 'participants' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(roomData?.participants || []).map((p) => {
              const isPPlayer = p.role === 'player';
              const isMe = p.userId === user?._id;
              const squadCount = (p.squad || []).length;
              const maxSquad = roomData?.format === 'T20' ? 13 : 15;

              return (
                <div
                  key={p.userId}
                  className={`bg-stadium-950 border p-4 rounded-2xl space-y-3 transition-colors ${
                    isMe
                      ? 'border-gold-500/60 shadow-gold-glow'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-sm text-white">
                          {p.teamName || `${p.username}'s XI`}
                        </span>
                        {p.isHost && (
                          <span className="bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-amber-500/40">
                            HOST
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        @{p.username} {isMe && '(You)'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        isPPlayer
                          ? 'bg-pitch-500/10 text-pitch-300 border-pitch-500/30'
                          : 'bg-electric-500/10 text-electric-300 border-electric-500/30'
                      }`}
                    >
                      {p.role}
                    </span>
                  </div>

                  {isPPlayer && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stadium-850 text-center font-mono text-xs">
                      <div className="bg-stadium-900 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-500 block">PURSE</span>
                        <strong className="text-gold-400 font-display">
                          {p.budgetRemaining !== undefined ? p.budgetRemaining : formatPurse}
                        </strong>
                      </div>
                      <div className="bg-stadium-900 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-500 block">SQUAD</span>
                        <strong className="text-pitch-400 font-display">
                          {squadCount}/{maxSquad}
                        </strong>
                      </div>
                      <div className="bg-stadium-900 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-500 block">VETOES</span>
                        <strong className="text-red-400 font-display">
                          {p.t2VetoTokens !== undefined ? p.t2VetoTokens : 2}/2
                        </strong>
                      </div>
                    </div>
                  )}

                  {!isPPlayer && (
                    <div className="p-2.5 rounded-lg bg-electric-500/5 border border-electric-500/20 text-electric-300 font-mono text-[11px] text-center">
                      Spectator in dugout • Observing live auction
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* T2 Veto Modal */}
      <T2VetoModal
        isOpen={vetoModalOpen}
        onClose={() => setVetoModalOpen(false)}
        onConfirm={handleExecuteT2Veto}
        currentLot={currentLot}
        remainingTokens={vetoTokens}
      />

      {/* Auction Replay Modal */}
      <AuctionReplayModal
        isOpen={replayModalOpen}
        onClose={() => setReplayModalOpen(false)}
        soldLots={auctionState?.soldLots || []}
        unsoldLots={auctionState?.unsoldLots || []}
        vetoedLots={auctionState?.vetoedLots || []}
        spendingHistory={auctionState?.spendingHistory || []}
        replayLogs={auctionState?.replayLogs || []}
      />

      {/* Auction Awards Modal */}
      <AuctionAwardsModal
        roomCode={roomCode}
        isOpen={awardsModalOpen}
        onClose={() => setAwardsModalOpen(false)}
      />
    </div>
  );
};
