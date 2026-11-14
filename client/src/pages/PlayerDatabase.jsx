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
  Award,
  Layers,
  CheckSquare,
  Square,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { FutCard } from '../components/common/FutCard';
import { PlayerProfileModal } from '../components/player/PlayerProfileModal';
import { PlayerCompareModal } from '../components/player/PlayerCompareModal';
import { sound } from '../services/sound';

export const PlayerDatabase = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [comparePlayers, setComparePlayers] = useState([]); // up to 2 players
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [filterMetadata, setFilterMetadata] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('All'); // 'All', 'Test', 'ODI', 'T20'
  const [roleFilter, setRoleFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [variantFilter, setVariantFilter] = useState('All');
  const [sortBy, setSortBy] = useState('ovr_desc');
  const [loading, setLoading] = useState(true);

  // Fetch filter metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.getPlayerFilterMetadata();
        if (res.success && res.metadata) {
          setFilterMetadata(res.metadata);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch filtered players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const params = {};
        if (roleFilter !== 'All') params.role = roleFilter;
        if (countryFilter !== 'All') params.country = countryFilter;
        if (formatFilter !== 'All') params.format = formatFilter;
        if (variantFilter !== 'All') params.cardVariant = variantFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const res = await api.getPlayers(params);
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
  }, [roleFilter, countryFilter, formatFilter, variantFilter, searchTerm]);

  // Handle player toggle for comparison
  const handleToggleCompare = (player) => {
    sound.playClick();
    if (comparePlayers.some((p) => p._id === player._id)) {
      setComparePlayers((prev) => prev.filter((p) => p._id !== player._id));
    } else {
      if (comparePlayers.length >= 2) {
        setComparePlayers([comparePlayers[1], player]);
      } else {
        setComparePlayers((prev) => [...prev, player]);
      }
    }
  };

  // Format-specific OVR helper (1–120 Scale)
  const getPlayerOvr = (p) => {
    const fmt = formatFilter !== 'All' ? formatFilter.toLowerCase() : 't20';
    return p.ovr?.[fmt] || p.ovr?.t20 || p.ovr?.odi || p.ovr?.test || p.overallRating || 90;
  };

  // Sorting logic
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'ovr_desc') return getPlayerOvr(b) - getPlayerOvr(a);
    if (sortBy === 'bat_desc') return (b.attributes?.batting || 0) - (a.attributes?.batting || 0);
    if (sortBy === 'bwl_desc') return (b.attributes?.bowling || 0) - (a.attributes?.bowling || 0);
    if (sortBy === 'price_desc') return (b.currentPrice || 0) - (a.currentPrice || 0);
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
              1–120 OVR RATING SYSTEM
            </span>
            <span className="text-xs font-mono text-pitch-400 font-bold">
              FORMAT SPECIFIC • 14 CORE ATTRIBUTES
            </span>
          </div>

          <h1 className="font-display text-4xl font-black uppercase text-white tracking-wide">
            PLAYER CARD DATABASE
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            HISTORICAL & MODERN INTERNATIONAL CRICKETERS ACROSS TEST, ODI & T20 FORMATS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gold-400 bg-gold-500/10 border border-gold-500/30 px-3.5 py-1.5 rounded-xl font-bold">
            {sortedPlayers.length} OFFICIAL CARDS LOADED
          </span>
        </div>
      </div>

      {/* Advanced Filter Console */}
      <div className="bg-stadium-900 border border-stadium-800 p-5 rounded-3xl space-y-4 shadow-xl">
        {/* Row 1: Search & Sort Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by cricketer name, nation, or initials (e.g. Bradman, Kohli, Bumrah)..."
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-stadium-950 border border-stadium-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-gold-500 w-full md:w-auto"
            >
              <option value="ovr_desc">Sort: Format OVR (120 to 1)</option>
              <option value="bat_desc">Sort: Batting Mastery</option>
              <option value="bwl_desc">Sort: Bowling Mastery</option>
              <option value="price_desc">Sort: Auction Base Value</option>
              <option value="name_asc">Sort: Name (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Cricket Format Switcher (Test, ODI, T20) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stadium-800">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
              FORMAT ELIGIBILITY:
            </span>
            {[
              { id: 'All', label: 'All Formats' },
              { id: 'Test', label: 'Test Matches (Flannels)' },
              { id: 'ODI', label: 'One Day International' },
              { id: 'T20', label: 'T20 International' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => {
                  sound.playClick();
                  setFormatFilter(fmt.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-display uppercase font-bold transition-all ${
                  formatFilter === fmt.id
                    ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                    : 'bg-stadium-950 border border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
              ROLE:
            </span>
            {['All', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  sound.playClick();
                  setRoleFilter(role);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-display uppercase font-bold transition-colors ${
                  roleFilter === role
                    ? 'bg-pitch-500 text-slate-950 shadow-pitch-glow'
                    : 'bg-stadium-950 border border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Country & Card Variant Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stadium-800 text-xs">
          {/* Country Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
              NATION:
            </span>
            {['All', 'India', 'Australia', 'West Indies', 'England', 'South Africa', 'Pakistan', 'Sri Lanka', 'Afghanistan'].map((c) => (
              <button
                key={c}
                onClick={() => {
                  sound.playClick();
                  setCountryFilter(c);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-display uppercase font-bold transition-colors ${
                  countryFilter === c
                    ? 'bg-electric-500 text-slate-950 shadow-electric-glow'
                    : 'bg-stadium-950 border border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Card Variant Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              VARIANT:
            </span>
            <select
              value={variantFilter}
              onChange={(e) => {
                sound.playClick();
                setVariantFilter(e.target.value);
              }}
              className="bg-stadium-950 border border-stadium-700 rounded-lg px-2.5 py-1 text-xs text-gold-400 font-mono font-bold focus:outline-none"
            >
              <option value="All">All Editions</option>
              <option value="Peak">Peak Variant (Max OVR)</option>
              <option value="Best">Best Season Variant</option>
              <option value="Average">Career Average Variant</option>
              <option value="Icon">Icon Hall of Fame</option>
              <option value="Legends">Cricket Legends</option>
              <option value="World Cup">World Cup Edition</option>
              <option value="All-Time Great">All-Time Great Edition</option>
              <option value="Captain">Tactical Captain Edition</option>
              <option value="Clutch">Clutch Match Winner</option>
              <option value="Anniversary">Anniversary Commemorative</option>
            </select>
          </div>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedPlayers.map((player) => (
          <FutCard
            key={player._id}
            player={player}
            activeFormat={formatFilter !== 'All' ? formatFilter : 't20'}
            isComparable={true}
            isSelectedForCompare={comparePlayers.some((p) => p._id === player._id)}
            onToggleCompare={handleToggleCompare}
            onClick={(p) => setSelectedPlayer(p)}
          />
        ))}
      </div>

      {/* Floating Comparison Tray (activates when 1 or 2 players selected) */}
      <AnimatePresence>
        {comparePlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stadium-900 border-2 border-gold-500/60 p-4 rounded-2xl shadow-gold-glow backdrop-blur-xl flex items-center gap-4 max-w-xl w-[92%]"
          >
            <div className="flex items-center gap-2 flex-1">
              {comparePlayers.map((cp, idx) => (
                <div
                  key={cp._id}
                  className="flex items-center gap-2 bg-stadium-950 px-2.5 py-1.5 rounded-xl border border-white/10"
                >
                  <span className="text-base">{cp.countryFlag}</span>
                  <span className="font-display font-bold text-xs text-white truncate max-w-[100px]">
                    {cp.shortName}
                  </span>
                  <span className="text-gold-400 font-mono font-bold text-xs">
                    {getPlayerOvr(cp)} OVR
                  </span>
                  <button
                    onClick={() => handleToggleCompare(cp)}
                    className="text-slate-500 hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              {comparePlayers.length === 1 && (
                <span className="text-xs font-mono text-slate-400 animate-pulse">
                  + Select 2nd card to compare
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparePlayers([])}
                className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1"
              >
                Clear
              </button>
              <button
                disabled={comparePlayers.length < 2}
                onClick={() => {
                  sound.playBidChime();
                  setIsCompareModalOpen(true);
                }}
                className="bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-slate-950 font-display uppercase font-bold text-xs px-4 py-2 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" /> COMPARE CARDS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Profile Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerProfileModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            onSelectCompare={(p) => {
              handleToggleCompare(p);
              setSelectedPlayer(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Head-to-Head Comparison Modal */}
      <AnimatePresence>
        {isCompareModalOpen && comparePlayers.length === 2 && (
          <PlayerCompareModal
            player1={comparePlayers[0]}
            player2={comparePlayers[1]}
            allPlayers={players}
            onClose={() => setIsCompareModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
