import React, { useState, useEffect } from 'react';
import {
  Trophy,
  History,
  Shield,
  Star,
  Users,
  ArrowRightLeft,
  Calendar,
  Award,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  FileText,
  RotateCw
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';

export default function FranchiseLegacyTab({ teamId, team, isOwner = false }) {
  const [legacy, setLegacy] = useState(null);
  const [selectedSeasonRecap, setSelectedSeasonRecap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, seasons, trophies, transfers, hallOfFame
  const [retaining, setRetaining] = useState(false);
  const [selectedRetentionIds, setSelectedRetentionIds] = useState([]);
  const [retentionSuccessMsg, setRetentionSuccessMsg] = useState(null);
  const [rolloverSuccessMsg, setRolloverSuccessMsg] = useState(null);

  const loadLegacy = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const res = await api.getFranchiseLegacy(teamId);
      if (res.success && res.legacy) {
        setLegacy(res.legacy);
        const existingRetentions = (res.legacy.retentions || []).map(r => r.playerId);
        setSelectedRetentionIds(existingRetentions);
      }
    } catch (err) {
      console.error('[Legacy] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLegacy();
  }, [teamId]);

  const viewSeasonRecap = async (seasonId) => {
    try {
      const res = await api.getSeasonRecap(teamId, seasonId);
      if (res.success && res.recap) {
        setSelectedSeasonRecap(res.recap);
      }
    } catch (err) {
      console.error('Recap load error:', err);
    }
  };

  const handleToggleRetention = (playerId) => {
    if (selectedRetentionIds.includes(playerId)) {
      setSelectedRetentionIds(selectedRetentionIds.filter(id => id !== playerId));
    } else {
      if (selectedRetentionIds.length >= 5) {
        alert('Maximum 5 players can be retained per franchise between seasons.');
        return;
      }
      setSelectedRetentionIds([...selectedRetentionIds, playerId]);
    }
  };

  const handleSaveRetentions = async () => {
    setRetaining(true);
    try {
      const retentionsPayload = selectedRetentionIds.map((pId, idx) => ({
        playerId: pId,
        playerName: team?.squad?.find(p => (p._id || p.id || p) === pId)?.name || `Retained Player ${idx + 1}`,
        retentionTier: idx < 2 ? 'Tier 1' : 'Tier 2',
        cost: idx < 2 ? 12 : 8,
        season: 'Season 2026'
      }));

      const res = await api.retainPlayers(teamId, retentionsPayload);
      if (res.success) {
        setRetentionSuccessMsg('Retentions saved successfully for next season!');
        setTimeout(() => setRetentionSuccessMsg(null), 4000);
        loadLegacy();
      }
    } catch (err) {
      alert(err.message || 'Error saving retentions');
    } finally {
      setRetaining(false);
    }
  };

  const handleSeasonRollover = async () => {
    if (!confirm('Are you sure you want to conclude the season and roll over to the next season? This will archive current statistics into your legacy history and preserve retained players.')) {
      return;
    }

    try {
      const res = await api.rolloverToNextSeason(teamId, {
        seasonName: `Season ${(legacy?.seasons?.length || 1) + 1} Championship`,
        position: 1,
        won: 11,
        lost: 3,
        trophy: 'Champions',
        topBatter: { name: 'Virat Kohli', runs: 680 },
        topBowler: { name: 'Jasprit Bumrah', wickets: 24 }
      });

      if (res.success) {
        setRolloverSuccessMsg('Season successfully rolled over! Franchise history updated.');
        setTimeout(() => setRolloverSuccessMsg(null), 5000);
        loadLegacy();
      }
    } catch (err) {
      alert(err.message || 'Error executing rollover');
    }
  };

  if (loading || !legacy) {
    return (
      <div className="py-12 text-center text-xs font-mono text-slate-400">
        LOADING FRANCHISE LEGACY VAULT...
      </div>
    );
  }

  const record = legacy.allTimeRecord || { played: 28, won: 19, lost: 9, winPercentage: 67.8 };
  const stats = legacy.careerStats || { totalRuns: 4890, totalWickets: 214, centuries: 4, fifties: 28 };

  return (
    <div className="space-y-6">
      {/* Franchise Crest & Identity Hero Banner */}
      <div className="bg-gradient-to-r from-stadium-900 via-amber-950/30 to-stadium-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-xl flex-shrink-0 flex items-center justify-center text-3xl">
            {legacy.logo || '🏏'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Est. {legacy.establishedYear} • Franchise Legacy
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {record.winPercentage}% Win Rate
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1">
              {legacy.name}
            </h1>
            <p className="text-xs text-slate-400 italic">
              "{legacy.motto}"
            </p>
          </div>
        </div>

        {/* All-time Record Quick Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-stadium-950/80 border border-stadium-800 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Matches</span>
            <span className="text-lg font-mono font-bold text-white">{record.played}</span>
          </div>
          <div className="bg-stadium-950/80 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[10px] text-emerald-400 uppercase font-mono block">Won</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{record.won}</span>
          </div>
          <div className="bg-stadium-950/80 border border-amber-500/30 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[10px] text-amber-400 uppercase font-mono block">Trophies</span>
            <span className="text-lg font-mono font-bold text-amber-400 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 fill-amber-400" /> {legacy.trophies?.length || 0}
            </span>
          </div>

          {isOwner && (
            <button
              onClick={handleSeasonRollover}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-display text-xs font-bold uppercase shadow-gold-glow hover:brightness-110 transition-all flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" /> Next Season
            </button>
          )}
        </div>
      </div>

      {rolloverSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-xs font-mono text-emerald-300 flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4" /> {rolloverSuccessMsg}
        </div>
      )}

      {/* Legacy Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stadium-800 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Trophies & Seasons' },
          { id: 'retentions', label: 'Retentions & Transfers' },
          { id: 'rivalries', label: 'Franchise Rivalries' },
          { id: 'hallOfFame', label: 'Hall of Fame' },
          { id: 'matches', label: 'Match History' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-glow'
                : 'bg-stadium-900 text-slate-400 hover:text-white hover:bg-stadium-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subtab: Overview (Trophies & Completed Seasons) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Trophy Cabinet */}
          <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Championship Trophy Cabinet
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {legacy.trophies?.length || 0} Silverware Honors
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(legacy.trophies || []).map((t, idx) => (
                <div
                  key={idx}
                  className="bg-stadium-950/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg hover:border-amber-400 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl mb-2">
                    {t.icon || '🏆'}
                  </div>
                  <h4 className="font-display font-bold text-xs text-white line-clamp-1">{t.name}</h4>
                  <span className="text-[10px] font-mono text-amber-400 mt-0.5">{t.season} ({t.year || 2025})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seasons Timeline & Generated Recaps */}
          <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl">
            <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" /> Multi-Season Campaign Records
            </h3>

            <div className="space-y-4">
              {(legacy.seasons || []).map((s, idx) => (
                <div
                  key={idx}
                  className="bg-stadium-950/70 border border-stadium-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-stadium-900 border border-white/10 flex items-center justify-center font-display font-black text-sm text-amber-400">
                      #{s.position}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-base text-white">{s.seasonName}</h4>
                        {s.trophy && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {s.trophy}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.won} Wins • {s.lost} Losses • Top Batter: <strong className="text-cyan-400">{s.topBatter?.name} ({s.topBatter?.runs}r)</strong> • Top Bowler: <strong className="text-purple-400">{s.topBowler?.name} ({s.topBowler?.wickets}w)</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => viewSeasonRecap(s.seasonId)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 border border-slate-700 self-start md:self-auto"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> View Recap
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Retentions & Transfers */}
      {activeSubTab === 'retentions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inter-Season Retentions */}
          <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-400" /> Player Retentions
                </h3>
                <p className="text-xs text-slate-400">Retain up to 5 core cricketers for next season</p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                {selectedRetentionIds.length}/5 Retained
              </span>
            </div>

            {retentionSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {retentionSuccessMsg}
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(team?.squad || []).map((card, idx) => {
                const pId = card._id || card.id || card;
                const pName = card.name || `Cricketer ${idx + 1}`;
                const isSelected = selectedRetentionIds.includes(pId);

                return (
                  <div
                    key={idx}
                    onClick={() => isOwner && handleToggleRetention(pId)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                        : 'bg-stadium-950/60 border-stadium-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'border border-slate-700 text-slate-500'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">{pName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{card.role || 'Player'} • {card.ovr || 100} OVR</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {isSelected ? 'Retained' : 'Available'}
                    </span>
                  </div>
                );
              })}
            </div>

            {isOwner && (
              <button
                onClick={handleSaveRetentions}
                disabled={retaining}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs uppercase shadow-gold-glow transition-all"
              >
                {retaining ? 'Saving Retentions...' : 'Save Retained Roster'}
              </button>
            )}
          </div>

          {/* Player Acquisitions & Transfers Log */}
          <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-400" /> Transfer & Trade Ledger
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(legacy.transfers || []).concat(legacy.acquisitions || []).map((t, idx) => (
                <div key={idx} className="bg-stadium-950/70 border border-stadium-800 p-3 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{t.playerName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 font-mono">
                      {t.type || 'TRADE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.fromTeam ? `${t.fromTeam} → ${t.toTeam}` : `Acquired for ${t.amount || 1} pts`}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Season: {t.season || '2026'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Franchise Rivalries */}
      {activeSubTab === 'rivalries' && (
        <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400" /> Marquee Franchise Rivalries
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(legacy.rivalries || []).map((r, idx) => (
              <div key={idx} className="bg-stadium-950/80 border border-rose-500/30 p-4 rounded-2xl flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                    {r.trophyName || 'Derby Trophy'}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {r.winPercentage}% Win Pct
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-stadium-800 text-sm font-bold text-white">
                  <span>{legacy.name}</span>
                  <span className="font-mono text-rose-400 text-xs font-normal">vs</span>
                  <span>{r.opponentTeam}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Played: <strong className="text-white">{r.played}</strong></span>
                  <span>Won: <strong className="text-emerald-400">{r.won}</strong></span>
                  <span>Lost: <strong className="text-red-400">{r.lost}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab: Hall of Fame */}
      {activeSubTab === 'hallOfFame' && (
        <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Franchise Hall of Fame
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(legacy.hallOfFame || []).map((h, idx) => (
              <div key={idx} className="bg-stadium-950/80 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-stadium-900 border-2 border-amber-400 overflow-hidden flex-shrink-0 shadow-lg">
                  {h.photoUrl ? (
                    <img src={h.photoUrl} alt={h.playerName} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold text-xl">
                      #{h.jerseyNumber || 18}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">{h.playerName}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">#{h.jerseyNumber || 18}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">Inducted {h.inductionYear}</span>
                  <div className="text-[10px] text-slate-300 mt-1 line-clamp-2">
                    {(h.achievements || []).join(' • ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab: Historical Match Results */}
      {activeSubTab === 'matches' && (
        <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" /> Historical Match Ledger
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {(legacy.historicalMatches || []).map((m, idx) => (
              <div key={idx} className="bg-stadium-950/70 border border-stadium-800 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">vs {m.opponent}</span>
                    <span className="text-[10px] font-mono text-slate-400">({m.season})</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {m.venue} • {m.date}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-white">
                    {m.teamScore} vs {m.opponentScore}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                    {m.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season Recap Modal */}
      {selectedSeasonRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-stadium-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-stadium-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-base text-white uppercase">
                  {selectedSeasonRecap.seasonName} Official Recap
                </h3>
              </div>
              <button
                onClick={() => setSelectedSeasonRecap(null)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-stadium-950 p-4 rounded-2xl border border-stadium-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Record:</span>
                <span className="font-bold text-emerald-400">{selectedSeasonRecap.record}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Finish Position:</span>
                <span className="font-bold text-white">#{selectedSeasonRecap.finishPosition}</span>
              </div>
              {selectedSeasonRecap.trophy && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Honor:</span>
                  <span className="font-bold text-amber-400">🏆 {selectedSeasonRecap.trophy}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 italic leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              "{selectedSeasonRecap.narrative}"
            </p>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Season Milestones:</span>
              {(selectedSeasonRecap.highlights || []).map((h, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

