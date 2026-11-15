import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Crown,
  Sparkles,
  TrendingUp,
  X,
  RotateCw,
  Flame,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';

export const AuctionAwardsModal = ({ roomCode, isOpen, onClose }) => {
  const [awardsData, setAwardsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && roomCode) {
      setLoading(true);
      api.getAuctionAwards(roomCode)
        .then(res => {
          if (res.success && res.awards) {
            setAwardsData(res.awards);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, roomCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-stadium-900 border border-gold-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="bg-gold-500/20 text-gold-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase flex items-center gap-1.5 w-fit">
            <Crown className="w-3.5 h-3.5" /> POST-AUCTION ANALYTICAL HONORS
          </span>
          <h2 className="font-display font-black text-2xl text-white uppercase mt-1">
            CRICKETVERSE OFFICIAL AUCTION AWARDS
          </h2>
          <p className="text-xs font-mono text-slate-400">
            PURSE VALUE EFFICIENCY • MARKET BARGAINS • MARQUEE INVESTMENTS • SQUAD BALANCE
          </p>
        </div>

        {loading || !awardsData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gold-400 font-mono text-xs">
            <RotateCw className="w-6 h-6 animate-spin text-gold-400" />
            <span>CALCULATING AUCTION LOT METRICS & VALUE RATIOS...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Best Value Pick */}
            <div className="p-5 bg-stadium-950 rounded-2xl border border-pitch-500/30 space-y-2">
              <span className="bg-pitch-500/20 text-pitch-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                {awardsData.bestValuePick?.title}
              </span>
              <h3 className="font-display font-black text-lg text-white uppercase mt-1">
                {awardsData.bestValuePick?.player}
              </h3>
              <p className="text-xs font-mono text-pitch-400">
                Team: {awardsData.bestValuePick?.team} • Sold for {awardsData.bestValuePick?.price} pts
              </p>
              <div className="pt-2 text-[10px] font-mono text-slate-400">
                Efficiency Ratio: <strong className="text-pitch-300">{awardsData.bestValuePick?.efficiencyRatio} OVR/pt</strong>
              </div>
            </div>

            {/* 2. Steal of the Auction */}
            <div className="p-5 bg-stadium-950 rounded-2xl border border-cyan-500/30 space-y-2">
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                {awardsData.stealOfTheAuction?.title}
              </span>
              <h3 className="font-display font-black text-lg text-white uppercase mt-1">
                {awardsData.stealOfTheAuction?.player}
              </h3>
              <p className="text-xs font-mono text-cyan-400">
                Team: {awardsData.stealOfTheAuction?.team} • Acquired for {awardsData.stealOfTheAuction?.price} pts
              </p>
              <div className="pt-2 text-[10px] font-mono text-slate-400">
                {awardsData.stealOfTheAuction?.notes}
              </div>
            </div>

            {/* 3. Marquee Buy */}
            <div className="p-5 bg-stadium-950 rounded-2xl border border-amber-500/30 space-y-2">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                {awardsData.marqueeBuy?.title}
              </span>
              <h3 className="font-display font-black text-lg text-white uppercase mt-1">
                {awardsData.marqueeBuy?.player}
              </h3>
              <p className="text-xs font-mono text-amber-400">
                Team: {awardsData.marqueeBuy?.team} • Outlay: {awardsData.marqueeBuy?.price} pts
              </p>
              <div className="pt-2 text-[10px] font-mono text-slate-400">
                {awardsData.marqueeBuy?.notes}
              </div>
            </div>

            {/* 4. Master Tactician */}
            <div className="p-5 bg-stadium-950 rounded-2xl border border-gold-500/30 space-y-2">
              <span className="bg-gold-500/20 text-gold-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                {awardsData.masterTactician?.title}
              </span>
              <h3 className="font-display font-black text-lg text-white uppercase mt-1">
                {awardsData.masterTactician?.team}
              </h3>
              <p className="text-xs font-mono text-gold-400">
                Squad Strength: {awardsData.masterTactician?.squadStrength} • Remaining: {awardsData.masterTactician?.remainingPurse} pts
              </p>
              <div className="pt-2 text-[10px] font-mono text-slate-400">
                Flawless purse management and optimal XI tactical balance.
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

