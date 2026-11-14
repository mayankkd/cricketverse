import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Sparkles,
  Zap,
  Trophy,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { FutCard } from '../components/common/FutCard';
import { sound } from '../services/sound';

export const PlayerDatabase = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [sortBy, setSortBy] = useState('overallRating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await api.getPlayers({
          role: roleFilter,
          cardTier: tierFilter,
          search: searchTerm
        });
        if (res.success && res.players) {
          setPlayers(res.players);
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [roleFilter, tierFilter, searchTerm]);

  // Sort logic
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'overallRating') return b.overallRating - a.overallRating;
    if (sortBy === 'bat') return (b.stats?.bat || 0) - (a.stats?.bat || 0);
    if (sortBy === 'bwl') return (b.stats?.bwl || 0) - (a.stats?.bwl || 0);
    if (sortBy === 'price') return (b.currentPrice || 0) - (a.currentPrice || 0);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black uppercase text-white tracking-wide">
            PLAYER CARD DATABASE
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            EXPLORE FUT RATINGS, SPECIAL TRAITS & AUCTION BASE VALUES
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gold-400 bg-gold-500/10 border border-gold-500/30 px-3 py-1.5 rounded-xl font-bold">
            {sortedPlayers.length} CARDS DISCOVERED
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-stadium-900 border border-stadium-800 p-4 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by player name or nation..."
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-stadium-950 border border-stadium-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="overallRating">Sort: Overall OVR (High to Low)</option>
              <option value="bat">Sort: Batting Rating</option>
              <option value="bwl">Sort: Bowling Rating</option>
              <option value="price">Sort: Auction Valuation</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stadium-800">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">Role:</span>
            {['All', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  sound.playClick();
                  setRoleFilter(role);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-display uppercase font-bold transition-colors ${
                  roleFilter === role
                    ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                    : 'bg-stadium-950 border border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Card Tier Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">Rarity:</span>
            {['All', 'ICON', 'DIAMOND', 'GOLD', 'EMERGING'].map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  sound.playClick();
                  setTierFilter(tier);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-display uppercase font-bold transition-colors ${
                  tierFilter === tier
                    ? 'bg-pitch-500 text-slate-950 shadow-pitch-glow'
                    : 'bg-stadium-950 border border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Players Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedPlayers.map((player) => (
          <FutCard
            key={player._id}
            player={player}
            onClick={(p) => setSelectedPlayer(p)}
          />
        ))}
      </div>

      {/* Player Inspect Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-stadium-900 border border-gold-500/50 p-6 rounded-3xl max-w-2xl w-full shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-stadium-950 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* 3D Card Display */}
                <div>
                  <FutCard player={selectedPlayer} compact={false} />
                </div>

                {/* In-depth Stats Breakdown */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-gold-400 tracking-wider">
                      {selectedPlayer.cardTier} COLLECTIBLE
                    </span>
                    <h2 className="font-display text-3xl font-black uppercase text-white mt-0.5">
                      {selectedPlayer.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedPlayer.country} • {selectedPlayer.franchise}
                    </p>
                  </div>

                  {/* Attribute Progress Bars */}
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      { key: 'Batting Skill (BAT)', val: selectedPlayer.stats?.bat, color: 'bg-gold-500' },
                      { key: 'Bowling Accuracy (BWL)', val: selectedPlayer.stats?.bwl, color: 'bg-pitch-500' },
                      { key: 'Fielding & Agility (FLD)', val: selectedPlayer.stats?.fld, color: 'bg-electric-500' },
                      { key: 'Power / Six Hitting (PWR)', val: selectedPlayer.stats?.pwr, color: 'bg-red-500' },
                      { key: 'Death Clutch (CLU)', val: selectedPlayer.stats?.clu, color: 'bg-amber-400' },
                      { key: 'Leadership Rating (LDR)', val: selectedPlayer.stats?.ldr, color: 'bg-indigo-400' }
                    ].map((stat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-slate-300">{stat.key}</span>
                          <span className="font-bold text-white">{stat.val} / 100</span>
                        </div>
                        <div className="w-full bg-stadium-950 h-2 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full ${stat.color}`}
                            style={{ width: `${stat.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Traits List */}
                  {selectedPlayer.specialTraits && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                        PLAYER TRAITS & ABILITIES
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPlayer.specialTraits.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-stadium-950 border border-gold-500/30 text-gold-300 text-xs px-2.5 py-1 rounded-lg font-medium"
                          >
                            ★ {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
