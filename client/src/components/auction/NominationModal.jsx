import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Filter,
  Sparkles,
  Dices,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame
} from 'lucide-react';
import { FutCard } from '../common/FutCard';
import { sound } from '../../services/sound';

export const NominationModal = ({
  isOpen,
  onClose,
  players = [],
  nominatedPlayerIds = [],
  vetoedLots = [],
  onNominate,
  onNominateRandom,
  isHost,
  isMyTurn,
  currentTurnUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');
  const [variantFilter, setVariantFilter] = useState('All');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Set of real-world cricketer IDs already in this auction
  const usedPlayerIdSet = useMemo(() => {
    return new Set(nominatedPlayerIds || []);
  }, [nominatedPlayerIds]);

  const vetoedIdSet = useMemo(() => {
    return new Set((vetoedLots || []).map(v => v.lot?.playerId));
  }, [vetoedLots]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (roleFilter !== 'All' && p.role !== roleFilter) return false;
      if (variantFilter !== 'All' && (p.cardVariant || 'Peak') !== variantFilter) return false;
      if (formatFilter !== 'All') {
        const fmtKey = formatFilter.toLowerCase();
        if (p.formatEligibility && p.formatEligibility[fmtKey] !== true) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(term);
        const matchCountry = p.country?.toLowerCase().includes(term);
        if (!matchName && !matchCountry) return false;
      }
      return true;
    });
  }, [players, roleFilter, formatFilter, variantFilter, searchTerm]);

  if (!isOpen) return null;

  const isEligible = (player) => {
    const realId = player.playerId || player._id;
    return !usedPlayerIdSet.has(realId) && !vetoedIdSet.has(realId);
  };

  const handleSelect = (player) => {
    sound.playClick();
    setSelectedPlayer(player);
  };

  const handleConfirmNominate = () => {
    if (!selectedPlayer) return;
    sound.playGavelStrike();
    onNominate(selectedPlayer);
    onClose();
  };

  const handleRandom = () => {
    sound.playGavelStrike();
    onNominateRandom();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl max-h-[90vh] bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-stadium-800 flex items-center justify-between bg-stadium-950/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gold-500/20 text-gold-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> GAVEL NOMINATION
              </span>
              <span className="text-xs font-mono text-slate-400">
                1 Cricketer Once Per Auction Rule Active
              </span>
            </div>
            <h2 className="font-display text-2xl font-black uppercase text-white tracking-wide">
              NOMINATE CRICKETER FOR GAVEL
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRandom}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl font-display uppercase font-bold text-xs flex items-center gap-2 transition-transform active:scale-95"
            >
              <Dices className="w-4 h-4" /> RANDOM LOT
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-stadium-800 hover:bg-stadium-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Turn banner if not turn */}
        {!isMyTurn && !isHost && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-2 text-amber-300 text-xs font-mono">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>It is currently <strong>{currentTurnUser || 'another manager'}</strong>'s turn to nominate. You can browse cards below.</span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="p-4 bg-stadium-950/30 border-b border-stadium-800 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by player name or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stadium-900 border border-stadium-700 focus:border-gold-500/60 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-stadium-900 border border-stadium-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-gold-500/60"
          >
            <option value="All">All Roles</option>
            <option value="Batter">Batter</option>
            <option value="Bowler">Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Wicketkeeper">Wicketkeeper</option>
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="bg-stadium-900 border border-stadium-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-gold-500/60"
          >
            <option value="All">All Formats</option>
            <option value="Test">Test Eligible</option>
            <option value="ODI">ODI Eligible</option>
            <option value="T20">T20 Eligible</option>
          </select>

          <select
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
            className="bg-stadium-900 border border-stadium-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-gold-500/60"
          >
            <option value="All">All Variants</option>
            <option value="Peak">Peak</option>
            <option value="Best">Best</option>
            <option value="Average">Average</option>
            <option value="Icon">Icon</option>
            <option value="Legends">Legends</option>
            <option value="World Cup">World Cup</option>
            <option value="Captain">Captain</option>
            <option value="Clutch">Clutch</option>
          </select>
        </div>

        {/* Content Body: Left Grid + Right Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Player Grid (2 Cols) */}
          <div className="md:col-span-2 overflow-y-auto p-4 space-y-2 border-r border-stadium-800">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-mono text-xs">
                No matching cricketers found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlayers.map((player) => {
                  const eligible = isEligible(player);
                  const isSelected = selectedPlayer?._id === player._id;
                  const isVetoed = vetoedIdSet.has(player.playerId || player._id);

                  return (
                    <div
                      key={player._id}
                      onClick={() => eligible && handleSelect(player)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gold-500/10 border-gold-400 shadow-gold-glow'
                          : eligible
                          ? 'bg-stadium-950/60 border-stadium-800 hover:border-stadium-700 hover:bg-stadium-950'
                          : 'bg-stadium-950/20 border-red-500/20 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-stadium-900">
                          <img
                            src={player.imageUrl || player.avatarUrl}
                            alt={player.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{player.countryFlag || '🏏'}</span>
                            <span className="font-display font-bold text-xs text-white truncate">
                              {player.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                            <span className="text-gold-400 font-bold">
                              OVR {player.ovr?.t20 || player.ovr?.odi || player.ovr?.test || player.overallRating}
                            </span>
                            <span>•</span>
                            <span>{player.role}</span>
                          </div>

                          <div className="mt-1">
                            {isVetoed ? (
                              <span className="text-[9px] font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded uppercase">
                                🚫 T2 VETOED
                              </span>
                            ) : !eligible ? (
                              <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                                🔒 IN AUCTION
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-pitch-400 font-bold bg-pitch-500/10 px-2 py-0.5 rounded uppercase">
                                {player.cardVariant || 'Peak'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {eligible ? (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-gold-500 border-gold-400 text-slate-950' : 'border-slate-700 text-slate-500'
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <Lock className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Selected Preview (1 Col) */}
          <div className="p-6 flex flex-col items-center justify-between bg-stadium-950/40">
            {selectedPlayer ? (
              <>
                <div className="w-full flex flex-col items-center">
                  <span className="text-[10px] font-mono text-gold-400 uppercase font-bold tracking-widest mb-3">
                    SELECTED FOR NOMINATION
                  </span>
                  <div className="w-full max-w-[240px]">
                    <FutCard player={selectedPlayer} compact={true} />
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-stadium-900 border border-stadium-800 text-center w-full">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                      FIXED STARTING PRICE
                    </span>
                    <span className="font-display font-black text-xl text-gold-400">
                      1 POINT
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                      Starting price is fixed at 1 point regardless of OVR or card variant.
                    </span>
                  </div>
                </div>

                <div className="w-full mt-4">
                  <button
                    onClick={handleConfirmNominate}
                    disabled={!isMyTurn && !isHost}
                    className="w-full bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-display font-black uppercase text-sm py-3.5 rounded-2xl shadow-gold-glow flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    PUT ON AUCTION BLOCK <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Flame className="w-12 h-12 text-slate-700 mb-3" />
                <p className="font-display uppercase font-bold text-sm text-slate-400">
                  Select a Cricketer
                </p>
                <p className="text-xs font-mono mt-1">
                  Click any available cricketer on the left to review attributes and bring to the gavel block.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

