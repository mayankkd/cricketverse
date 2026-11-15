import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, AlertTriangle, X, Check } from 'lucide-react';
import { sound } from '../../services/sound';

export const T2VetoModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentLot,
  remainingTokens = 2
}) => {
  if (!isOpen || !currentLot) return null;

  const handleConfirm = () => {
    sound.playWicketFall();
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-gradient-to-b from-stadium-900 via-stadium-950 to-red-950/40 border border-red-500/50 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-red-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block">
                SPECIAL POWER PLAY
              </span>
              <h3 className="font-display text-xl font-black uppercase text-white">
                USE T2 VETO TOKEN?
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stadium-800 hover:bg-stadium-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Target Player */}
        <div className="my-5 p-4 rounded-2xl bg-stadium-950 border border-white/10 flex items-center gap-4">
          <div className="w-14 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-stadium-900">
            <img
              src={currentLot.playerImage}
              alt={currentLot.playerName}
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{currentLot.countryFlag || '🏏'}</span>
              <p className="font-display font-bold text-sm text-white truncate">
                {currentLot.playerName}
              </p>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {currentLot.role} • {currentLot.cardVariant} • OVR {typeof currentLot.ovr === 'object' ? (currentLot.ovr.t20 || 95) : currentLot.ovr}
            </p>
            <span className="text-[10px] font-mono text-gold-400 font-bold">
              Current Bid: {currentLot.currentBid} pts
            </span>
          </div>
        </div>

        {/* Rules Reminder Box */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-red-950/20 border border-red-500/20 text-xs font-mono text-slate-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Permanent Elimination:</strong> This cricketer will be immediately removed from the auction block and CANNOT return in the unsold round.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>All Variants Barred:</strong> No other card variant (Peak, Best, Average, etc.) of this cricketer can appear.
            </span>
          </div>
          <div className="flex items-start gap-2 text-gold-300 font-bold pt-1 border-t border-red-500/20">
            <span>You have {remainingTokens} of 2 T2 Veto tokens remaining. (Non-refundable)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-stadium-700 hover:bg-stadium-800 text-slate-300 font-display font-bold uppercase text-xs transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-display font-black uppercase text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" /> CONFIRM T2 VETO
          </button>
        </div>
      </motion.div>
    </div>
  );
};
