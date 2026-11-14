import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel,
  Flame,
  Clock,
  Coins,
  Shield,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Zap,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FutCard } from '../components/common/FutCard';
import { sound } from '../services/sound';

export const AuctionDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  const [playersQueue, setPlayersQueue] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(200000000); // 20 Cr
  const [highestBidder, setHighestBidder] = useState('Bangalore Royal Titans');
  const [timeLeft, setTimeLeft] = useState(15);
  const [bidHistory, setBidHistory] = useState([
    { id: '1', manager: 'Mumbai Kings XI', amount: 180000000, time: '30s ago' },
    { id: '2', manager: 'Bangalore Royal Titans', amount: 200000000, time: '12s ago' }
  ]);
  const [userPurse, setUserPurse] = useState(user?.budget || 885000000);
  const [isSold, setIsSold] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await api.getPlayers();
        if (res.success && res.players) {
          setPlayersQueue(res.players);
          if (res.players[0]) {
            setCurrentBid(res.players[0].basePrice || 200000000);
          }
        }
      } catch (err) {
        console.error('Error fetching auction queue:', err);
      }
    };

    fetchQueue();
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (isSold || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleHammerSold();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSold]);

  const handleHammerSold = () => {
    setIsSold(true);
    sound.playSixHit();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    addToast({
      type: 'gold',
      title: 'HAMMER DOWN! SOLD!',
      message: `${playersQueue[currentPlayerIndex]?.name || 'Player'} sold to ${highestBidder} for ₹${(currentBid / 10000000).toFixed(2)} Cr!`
    });
  };

  const handlePlaceBid = (increment) => {
    sound.playBidChime();
    const newBidAmount = currentBid + increment;

    if (newBidAmount > userPurse) {
      addToast({
        type: 'error',
        title: 'PURSE EXCEEDED',
        message: 'Insufficient auction purse balance to place this bid!'
      });
      return;
    }

    setCurrentBid(newBidAmount);
    setHighestBidder(user?.username ? `${user.username}'s XI` : 'Bangalore Royal Titans');
    setTimeLeft(15); // Reset clock to 15s on new bid

    setBidHistory((prev) => [
      {
        id: `bid_${Date.now()}`,
        manager: user?.username ? `${user.username}'s XI` : 'Bangalore Royal Titans',
        amount: newBidAmount,
        time: 'Just now'
      },
      ...prev
    ]);
  };

  const handleNextPlayer = () => {
    sound.playClick();
    if (currentPlayerIndex < playersQueue.length - 1) {
      const nextIdx = currentPlayerIndex + 1;
      setCurrentPlayerIndex(nextIdx);
      setCurrentBid(playersQueue[nextIdx]?.basePrice || 150000000);
      setHighestBidder('Base Price Uncontested');
      setTimeLeft(15);
      setIsSold(false);
      setBidHistory([]);
    }
  };

  const activePlayer = playersQueue[currentPlayerIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Auction Stage Header */}
      <div className="bg-gradient-to-r from-stadium-950 via-stadium-900 to-amber-950/40 border border-gold-500/40 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-red-600 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              <Flame className="w-3.5 h-3.5" /> LIVE MEGA AUCTION
            </span>
            <span className="text-xs font-mono text-gold-400 font-bold">
              LOT #{currentPlayerIndex + 1} OF {playersQueue.length}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            THE HAMMER ARENA
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            BID IN REAL-TIME TO SECURE ICON & DIAMOND MARQUEE CRICKETERS
          </p>
        </div>

        {/* Manager Live Purse Indicator */}
        <div className="bg-stadium-950 p-4 rounded-2xl border border-gold-500/40 shadow-gold-glow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
            <Coins className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
              Your Remaining Purse
            </span>
            <span className="font-display font-black text-2xl text-gold-300">
              ₹{(userPurse / 10000000).toFixed(2)} Cr
            </span>
          </div>
        </div>
      </div>

      {/* Main Auction Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Player Stage & Card (1 Col) */}
        <div className="flex flex-col items-center justify-center bg-stadium-900 border border-stadium-800 p-6 rounded-3xl relative">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">CURRENT NOMINATION</span>
            <span className="text-xs font-mono text-pitch-400 font-bold">
              BASE: ₹{((activePlayer?.basePrice || 200000000) / 10000000).toFixed(1)} Cr
            </span>
          </div>

          {activePlayer && (
            <div className="w-full max-w-xs">
              <FutCard player={activePlayer} compact={false} />
            </div>
          )}

          {isSold && (
            <div className="mt-4 w-full text-center">
              <button
                onClick={handleNextPlayer}
                className="w-full bg-pitch-600 hover:bg-pitch-500 text-white font-display uppercase font-bold text-xs py-3 rounded-xl shadow-pitch-glow flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                BRING OUT NEXT LOT <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Middle: Live Bid Control Console (1 Col) */}
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
              ₹{(currentBid / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-xs font-mono text-slate-300 font-bold block mt-1">
              Leader: <span className="text-pitch-400">{highestBidder}</span>
            </span>
          </div>

          {/* Interactive Bidding Increment Buttons */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-2">
              RAISE BID INCREMENT
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '+₹25 Lakh', inc: 2500000 },
                { label: '+₹50 Lakh', inc: 5000000 },
                { label: '+₹1.00 Cr', inc: 10000000 },
                { label: '+₹2.00 Cr', inc: 20000000 }
              ].map((btn, i) => (
                <button
                  key={i}
                  disabled={isSold}
                  onClick={() => handlePlaceBid(btn.inc)}
                  className="bg-stadium-950 hover:bg-gold-500 hover:text-slate-950 border border-gold-500/40 text-gold-300 font-display font-bold uppercase text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" /> {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Bidding Feed & Next Queue (1 Col) */}
        <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl flex flex-col h-[540px]">
          <div className="flex items-center justify-between pb-3 border-b border-stadium-800 mb-3">
            <h3 className="font-display text-base font-bold uppercase text-white">LIVE GAVEL FEED</h3>
            <span className="text-[10px] font-mono text-gold-400 font-bold">REAL-TIME BIDS</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
            {bidHistory.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-stadium-950 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-display font-bold text-white block truncate max-w-[130px]">
                    {b.manager}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{b.time}</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-sm text-gold-400">
                    ₹{(b.amount / 10000000).toFixed(2)} Cr
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Next Up in Queue */}
          <div className="mt-4 pt-4 border-t border-stadium-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-2">
              ON DECK (NEXT UP):
            </span>
            {playersQueue[currentPlayerIndex + 1] ? (
              <div className="p-2.5 rounded-xl bg-stadium-950 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xs text-white">
                    {playersQueue[currentPlayerIndex + 1].name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {playersQueue[currentPlayerIndex + 1].role} • OVR {playersQueue[currentPlayerIndex + 1].overallRating}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-gold-400 font-bold">
                  {playersQueue[currentPlayerIndex + 1].cardTier}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono">End of marquee catalog</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
