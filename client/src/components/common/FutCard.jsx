import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Sparkles, Award } from 'lucide-react';
import { sound } from '../../services/sound';

export const FutCard = ({ player, onClick, compact = false, showBidButton = false, onBid = null }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  if (!player) return null;

  const tierStyles = {
    ICON: {
      border: 'border-amber-400/80',
      bg: 'from-amber-600/30 via-slate-900/90 to-amber-950/40',
      badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950',
      glow: 'shadow-fut-icon',
      headerText: 'text-amber-300',
      statColor: 'text-amber-400',
      rarity: 'ICON LEGEND'
    },
    DIAMOND: {
      border: 'border-cyan-400/80',
      bg: 'from-cyan-600/30 via-slate-900/90 to-blue-950/40',
      badgeBg: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950',
      glow: 'shadow-fut-diamond',
      headerText: 'text-cyan-300',
      statColor: 'text-cyan-400',
      rarity: 'DIAMOND ELITE'
    },
    GOLD: {
      border: 'border-yellow-500/70',
      bg: 'from-yellow-700/20 via-slate-900/90 to-yellow-950/30',
      badgeBg: 'bg-yellow-500 text-slate-950',
      glow: 'shadow-gold-glow',
      headerText: 'text-yellow-400',
      statColor: 'text-yellow-400',
      rarity: 'RARE GOLD'
    },
    SILVER: {
      border: 'border-slate-400/60',
      bg: 'from-slate-600/20 via-slate-900/90 to-slate-950/40',
      badgeBg: 'bg-slate-300 text-slate-950',
      glow: 'shadow-lg',
      headerText: 'text-slate-300',
      statColor: 'text-slate-300',
      rarity: 'SILVER STAR'
    },
    EMERGING: {
      border: 'border-pitch-400/80',
      bg: 'from-pitch-600/30 via-slate-900/90 to-emerald-950/40',
      badgeBg: 'bg-gradient-to-r from-pitch-400 to-emerald-500 text-slate-950',
      glow: 'shadow-pitch-glow',
      headerText: 'text-pitch-300',
      statColor: 'text-pitch-400',
      rarity: 'EMERGING PRODIGY'
    }
  };

  const style = tierStyles[player.cardTier] || tierStyles.GOLD;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 8);
    setRotateY((centerX - x) / 8);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const formatPrice = (price) => {
    if (!price) return '₹2.0 Cr';
    const cr = price / 10000000;
    return `₹${cr.toFixed(1)} Cr`;
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      whileHover={{ scale: 1.03 }}
      onClick={() => {
        sound.playClick();
        if (onClick) onClick(player);
      }}
      className={`relative cursor-pointer transition-shadow rounded-2xl p-0.5 border ${style.border} ${style.glow} bg-gradient-to-b ${style.bg} backdrop-blur-md overflow-hidden select-none group`}
      style={{ perspective: 1000 }}
    >
      {/* Dynamic Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Rarity Header Bar */}
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 bg-stadium-950/60">
        <span className="text-[10px] font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold-400" /> {style.rarity}
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
          {player.franchise?.split(' ').map(w => w[0]).join('') || 'IND'}
        </span>
      </div>

      {/* Card Content Body */}
      <div className="p-3">
        {/* Rating, Role & Nation column + Avatar */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-center">
            <span className={`font-display text-4xl font-black leading-none ${style.headerText}`}>
              {player.overallRating}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display mt-0.5">
              {player.role === 'Batter' ? 'BAT' : player.role === 'Bowler' ? 'BWL' : player.role === 'All-Rounder' ? 'ALL' : 'WK'}
            </span>
            <span className="text-base mt-1" title={player.country}>
              {player.countryFlag || '🏏'}
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-1">
              #{player.jerseyNumber || 18}
            </span>
          </div>

          {/* Player Portrait */}
          <div className="relative w-28 h-32 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-xl bg-stadium-900/60 border border-white/10 group-hover:border-gold-500/50 transition-colors">
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top filter contrast-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <Shield className="w-12 h-12 text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stadium-950 via-transparent to-transparent opacity-80" />
          </div>
        </div>

        {/* Player Name Banner */}
        <div className="mt-2 text-center border-t border-b border-white/10 py-1.5 bg-stadium-900/50">
          <h3 className="font-display text-base font-bold text-white tracking-wide uppercase truncate">
            {player.shortName || player.name}
          </h3>
          <p className="text-[10px] text-slate-400 truncate">
            {player.battingStyle} • {player.bowlingStyle}
          </p>
        </div>

        {/* 6 FUT Core Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5 my-2.5 bg-stadium-950/70 p-2 rounded-xl border border-white/5">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-mono">BAT</span>
            <span className="text-sm font-black font-display text-white">{player.stats?.bat || 85}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-mono">BWL</span>
            <span className="text-sm font-black font-display text-white">{player.stats?.bwl || 45}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-mono">FLD</span>
            <span className="text-sm font-black font-display text-white">{player.stats?.fld || 90}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-mono">PWR</span>
            <span className={`text-sm font-black font-display ${style.statColor}`}>{player.stats?.pwr || 92}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-mono">CLU</span>
            <span className="text-sm font-black font-display text-white">{player.stats?.clu || 95}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-mono">LDR</span>
            <span className="text-sm font-black font-display text-white">{player.stats?.ldr || 88}</span>
          </div>
        </div>

        {/* Traits Pills */}
        {player.specialTraits && player.specialTraits.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-2">
            {player.specialTraits.slice(0, 2).map((trait, i) => (
              <span
                key={i}
                className="text-[9px] bg-stadium-800 border border-white/10 px-1.5 py-0.5 rounded text-gold-300 font-medium"
              >
                ★ {trait}
              </span>
            ))}
          </div>
        )}

        {/* Price / Auction Action */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-mono">Valuation</span>
            <span className="font-display font-bold text-sm text-gold-400">
              {formatPrice(player.currentPrice || player.basePrice)}
            </span>
          </div>
          
          {showBidButton ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playBidChime();
                if (onBid) onBid(player);
              }}
              className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-3 py-1.5 rounded-lg shadow-gold-glow transition-transform active:scale-95 flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> BID
            </button>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-2 py-0.5 rounded-md bg-white/5">
              VIEW STATS
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

