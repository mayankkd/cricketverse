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
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FutCard } from '../components/common/FutCard';
import { socketService } from '../services/socket';
import { sound } from '../services/sound';
import { NominationModal } from '../components/auction/NominationModal';
import { T2VetoModal } from '../components/auction/T2VetoModal';
import { AuctionReplayModal } from '../components/auction/AuctionReplayModal';

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
  const [dramaticOverlay, setDramaticOverlay] = useState(null);

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
        }
      } catch (err) {
        console.warn('Could not load specific room, operating in sandbox mode:', err.message);
      }
    };

    loadRoomData();

    // Socket.io Real-time connection
    socketService.joinRoom(code, {
      role: isSpectator ? 'spectator' : 'player',
      teamName: user ? `${user.username}'s XI` : 'Franchise'
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
        setCurrentBid(lot.startingPrice || 1);
        setHighestBidder('Starting Price (Uncontested)');
        setHighestBidderTeam(null);
        setHighestBidderId(null);
        setTimeLeft(15);
        setIsSold(false);
        setIsVetoed(false);
        setBidHistory([]);
        addToast({
          type: 'gold',
          title: 'LOT NOMINATED',
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
    });

    const unsubError = socketService.onActionError((err) => {
      sound.playWarningBeep();
      addToast({
        type: 'error',
        title: 'ACTION REJECTED',
        message: err.message
      });
    });

    return () => {
      unsubRoom();
      unsubAuction();
      unsubBid();
      unsubNominated();
      unsubVeto();
      unsubHammer();
      unsubError();
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
      addToast({
        type: 'gold',
        title: 'HAMMER DOWN! SOLD!',
        message: `${lot.playerName} sold to ${lot.highestBidderUsername} for ${lot.currentBid} points!`
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

      {/* Top Action Ribbon: Nominate Button, Replay Logs, Unsold Round */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stadium-900 border border-stadium-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          {!isSpectator && (
            <button
              onClick={() => setNominationOpen(true)}
              className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-display font-bold uppercase text-xs px-4 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> NOMINATE CRICKETER
            </button>
          )}

          {!isSpectator && (
            <button
              onClick={handleNominateRandom}
              className="bg-stadium-950 hover:bg-stadium-850 border border-stadium-700 text-slate-300 font-display font-bold uppercase text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Dices className="w-4 h-4 text-amber-400" /> RANDOM
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartUnsoldRound}
              className="bg-pitch-900/30 hover:bg-pitch-900/50 border border-pitch-500/40 text-pitch-300 font-display font-bold uppercase text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> START UNSOLD ROUND
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Nomination Turn: <strong className="text-gold-400">{currentTurnUserName}</strong>
          </span>

          <button
            onClick={() => setReplayModalOpen(true)}
            className="bg-stadium-950 hover:bg-stadium-850 border border-white/10 text-slate-300 hover:text-white font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-gold-400" /> REPLAY & LOGS
          </button>
        </div>
      </div>

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

          {currentLot ? (
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
                  name: currentLot.playerName,
                  role: currentLot.role,
                  country: currentLot.country,
                  countryFlag: currentLot.countryFlag,
                  cardVariant: currentLot.cardVariant,
                  overallRating: typeof currentLot.ovr === 'object' ? (currentLot.ovr.t20 || 90) : currentLot.ovr,
                  ovr: currentLot.ovr,
                  imageUrl: currentLot.playerImage,
                  avatarUrl: currentLot.playerImage,
                  basePrice: 1
                }}
                compact={false}
              />
            </div>
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center border-2 border-dashed border-stadium-800 rounded-2xl text-center p-6 text-slate-500">
              <Gavel className="w-12 h-12 text-slate-700 mb-3" />
              <p className="font-display font-bold uppercase text-slate-400 text-sm">
                No Cricketer Nominated
              </p>
              <p className="text-xs font-mono mt-1">
                Click "Nominate Cricketer" or "Random" above to bring a player to the block.
              </p>
            </div>
          )}

          {/* Post-lot next button */}
          {(isSold || isVetoed) && (
            <div className="mt-4 w-full text-center">
              <button
                onClick={() => setNominationOpen(true)}
                className="w-full bg-pitch-600 hover:bg-pitch-500 text-white font-display uppercase font-bold text-xs py-3 rounded-xl shadow-pitch-glow flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                NOMINATE NEXT LOT <ArrowRight className="w-4 h-4" />
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

      {/* Nomination Modal */}
      <NominationModal
        isOpen={nominationOpen}
        onClose={() => setNominationOpen(false)}
        players={allPlayers}
        nominatedPlayerIds={auctionState?.nominatedPlayerIds || []}
        vetoedLots={auctionState?.vetoedLots || []}
        onNominate={handleNominatePlayer}
        onNominateRandom={handleNominateRandom}
        isHost={isHost}
        isMyTurn={isMyTurn}
        currentTurnUser={currentTurnUserName}
      />

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
    </div>
  );
};
