import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Shield,
  Trophy,
  Award,
  Zap,
  Info,
  Calendar,
  Activity,
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import { PlayerImage } from '../common/PlayerImage';
import { sound } from '../../services/sound';

export const PlayerProfileModal = ({ player, onClose, onSelectCompare = null }) => {
  const [selectedFormat, setSelectedFormat] = useState('odi'); // 'test', 'odi', 't20'
  const [selectedVariant, setSelectedVariant] = useState(player?.cardVariant || 'Peak');
  const [activeTab, setActiveTab] = useState('attributes'); // 'attributes', 'stats', 'domestic'

  if (!player) return null;

  // Selected format OVR
  const currentFormatOvr = player.ovr?.[selectedFormat] || (player.formatEligibility?.[selectedFormat] === false ? 'N/A' : player.overallRating || 95);

  // Radar data for key attribute groupings
  const radarData = [
    { subject: 'Batting', A: player.attributes?.batting || player.stats?.bat || 80, fullMark: 120 },
    { subject: 'Power', A: player.attributes?.powerHitting || player.stats?.pwr || 75, fullMark: 120 },
    { subject: 'Fielding', A: player.attributes?.fielding || player.stats?.fld || 85, fullMark: 120 },
    { subject: 'Fitness', A: player.attributes?.fitness || 85, fullMark: 120 },
    { subject: 'Clutch', A: player.attributes?.temperament || player.stats?.clu || 90, fullMark: 120 },
    { subject: 'Bowling', A: player.attributes?.bowling || player.stats?.bwl || 50, fullMark: 120 },
    { subject: 'Captaincy', A: player.attributes?.captaincy || player.stats?.ldr || 80, fullMark: 120 },
    { subject: 'Defense', A: player.attributes?.defensiveTechnique || 85, fullMark: 120 }
  ];

  // The 14 official cricket attributes categorized
  const attributeGroups = [
    {
      title: 'Batting & Technique',
      items: [
        { label: 'Batting Skill', key: 'batting', val: player.attributes?.batting || 80, color: 'bg-gold-500' },
        { label: 'Power Hitting', key: 'powerHitting', val: player.attributes?.powerHitting || 75, color: 'bg-amber-400' },
        { label: 'Strike Rotation', key: 'strikeRotation', val: player.attributes?.strikeRotation || 80, color: 'bg-yellow-400' },
        { label: 'Defensive Technique', key: 'defensiveTechnique', val: player.attributes?.defensiveTechnique || 85, color: 'bg-gold-300' }
      ]
    },
    {
      title: 'Bowling Mastery',
      items: [
        { label: 'Bowling Overall', key: 'bowling', val: player.attributes?.bowling || 50, color: 'bg-pitch-500' },
        { label: 'Pace & Speed', key: 'pace', val: player.attributes?.pace || 40, color: 'bg-emerald-400' },
        { label: 'Swing Movement', key: 'swing', val: player.attributes?.swing || 40, color: 'bg-teal-400' },
        { label: 'Spin & Turn', key: 'spin', val: player.attributes?.spin || 40, color: 'bg-green-400' },
        { label: 'Death Bowling', key: 'deathBowling', val: player.attributes?.deathBowling || 40, color: 'bg-pitch-400' }
      ]
    },
    {
      title: 'Athleticism & Mentality',
      items: [
        { label: 'Fielding Reflexes', key: 'fielding', val: player.attributes?.fielding || 85, color: 'bg-cyan-500' },
        { label: 'Physical Fitness', key: 'fitness', val: player.attributes?.fitness || 90, color: 'bg-blue-400' },
        { label: 'Temperament', key: 'temperament', val: player.attributes?.temperament || 90, color: 'bg-indigo-400' },
        { label: 'Match Consistency', key: 'consistency', val: player.attributes?.consistency || 88, color: 'bg-purple-400' },
        { label: 'Tactical Captaincy', key: 'captaincy', val: player.attributes?.captaincy || 80, color: 'bg-rose-400' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stadium-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="bg-stadium-900 border border-gold-500/50 rounded-3xl max-w-4xl w-full shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Action Bar */}
        <div className="px-6 py-4 border-b border-stadium-800 bg-stadium-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{player.countryFlag}</span>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-gold-400 tracking-wider block">
                {player.country} • {player.era}
              </span>
              <h2 className="font-display text-2xl font-black uppercase text-white tracking-wide">
                {player.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSelectCompare && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectCompare(player);
                }}
                className="bg-stadium-950 hover:bg-stadium-800 border border-gold-500/40 text-gold-300 font-display uppercase font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
              >
                + Compare
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-stadium-950 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Profile Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-stadium-950/60 p-5 rounded-2xl border border-white/5">
            {/* Player Photograph with Legal Attribution */}
            <div className="relative w-44 h-52 mx-auto md:mx-0 rounded-2xl overflow-hidden border-2 border-gold-500/50 shadow-gold-glow bg-stadium-900 flex-shrink-0">
              <PlayerImage
                player={player}
                format={selectedFormat}
                showAttribution={true}
              />
            </div>

            {/* Core Info & Format OVR Ratings */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Format OVR Selector Tabs (1–120 Scale!) */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    FORMAT OVR RATING (1–120 SCALE)
                  </span>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'test', label: 'Test', val: player.ovr?.test, eligible: player.formatEligibility?.test },
                      { id: 'odi', label: 'ODI', val: player.ovr?.odi, eligible: player.formatEligibility?.odi },
                      { id: 't20', label: 'T20', val: player.ovr?.t20, eligible: player.formatEligibility?.t20 }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => {
                          sound.playClick();
                          setSelectedFormat(fmt.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-center transition-all ${
                          selectedFormat === fmt.id
                            ? 'bg-gold-500 text-slate-950 border-gold-400 font-bold shadow-gold-glow'
                            : 'bg-stadium-900 border-stadium-750 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] block font-mono uppercase">{fmt.label}</span>
                        <span className="font-display font-black text-lg">
                          {fmt.eligible ? (fmt.val || 'N/A') : 'N/A'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Variant Selector */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    ACTIVE CARD VARIANT
                  </span>
                  <select
                    value={selectedVariant}
                    onChange={(e) => {
                      sound.playClick();
                      setSelectedVariant(e.target.value);
                    }}
                    className="bg-stadium-900 border border-gold-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gold-300 focus:outline-none"
                  >
                    {[
                      'Peak',
                      'Best',
                      'Average',
                      'Icon',
                      'Legends',
                      'World Cup',
                      'All-Time Great',
                      'Captain',
                      'Clutch',
                      'Anniversary'
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v} Edition
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batting Hand & Bowling Style */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-stadium-900 border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">Batting Hand</span>
                  <span className="font-bold text-white">{player.battingStyle}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-stadium-900 border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">Bowling Style</span>
                  <span className="font-bold text-white">{player.bowlingStyle}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-stadium-900 border border-white/5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Role</span>
                  <span className="font-bold text-gold-400">{player.role}</span>
                </div>
              </div>

              {/* Bio snippet */}
              {player.bio && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-stadium-900/60 p-3 rounded-xl border border-white/5">
                  {player.bio}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Attributes vs International Stats vs Franchise / Domestic) */}
          <div className="flex items-center gap-2 border-b border-stadium-800 pb-2">
            {[
              { id: 'attributes', label: '14 Core Attributes (1–120 Scale)' },
              { id: 'stats', label: 'International Statistics' },
              { id: 'domestic', label: 'Franchise & Domestic Record' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-display uppercase font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gold-500/10 border border-gold-500/50 text-gold-400 shadow-gold-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: 14 Core Attributes */}
          {activeTab === 'attributes' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {attributeGroups.map((group, idx) => (
                <div key={idx} className="bg-stadium-950/70 p-4 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="font-display font-bold text-xs uppercase text-slate-300 border-b border-white/5 pb-2">
                    {group.title}
                  </h4>
                  <div className="space-y-2.5">
                    {group.items.map((attr) => (
                      <div key={attr.key}>
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="text-slate-300">{attr.label}</span>
                          <span className="font-bold text-white">{attr.val} / 120</span>
                        </div>
                        <div className="w-full bg-stadium-900 h-2 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full ${attr.color}`}
                            style={{ width: `${Math.min(100, (attr.val / 120) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: International Statistics */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                {/* Test Stats */}
                <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-display font-bold text-sm text-gold-400 block border-b border-white/5 pb-1">
                    TEST MATCH RECORD
                  </span>
                  {player.formatEligibility?.test ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between"><span>Matches:</span> <strong className="text-white">{player.internationalStats?.test?.matches || 0}</strong></div>
                      <div className="flex justify-between"><span>Runs:</span> <strong className="text-white">{player.internationalStats?.test?.runs || 0}</strong></div>
                      <div className="flex justify-between"><span>High Score:</span> <strong className="text-white">{player.internationalStats?.test?.highestScore || '-'}</strong></div>
                      <div className="flex justify-between"><span>Batting Avg:</span> <strong className="text-pitch-400">{player.internationalStats?.test?.average || 0}</strong></div>
                      <div className="flex justify-between"><span>Centuries (100s):</span> <strong className="text-gold-400">{player.internationalStats?.test?.hundreds || 0}</strong></div>
                      <div className="flex justify-between"><span>Wickets:</span> <strong className="text-cyan-400">{player.internationalStats?.test?.wickets || 0}</strong></div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px] py-4 text-center">Never appeared in official Test cricket</p>
                  )}
                </div>

                {/* ODI Stats */}
                <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-display font-bold text-sm text-pitch-400 block border-b border-white/5 pb-1">
                    ODI INTERNATIONAL RECORD
                  </span>
                  {player.formatEligibility?.odi ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between"><span>Matches:</span> <strong className="text-white">{player.internationalStats?.odi?.matches || 0}</strong></div>
                      <div className="flex justify-between"><span>Runs:</span> <strong className="text-white">{player.internationalStats?.odi?.runs || 0}</strong></div>
                      <div className="flex justify-between"><span>High Score:</span> <strong className="text-white">{player.internationalStats?.odi?.highestScore || '-'}</strong></div>
                      <div className="flex justify-between"><span>Batting Avg:</span> <strong className="text-pitch-400">{player.internationalStats?.odi?.average || 0}</strong></div>
                      <div className="flex justify-between"><span>Centuries (100s):</span> <strong className="text-gold-400">{player.internationalStats?.odi?.hundreds || 0}</strong></div>
                      <div className="flex justify-between"><span>Wickets:</span> <strong className="text-cyan-400">{player.internationalStats?.odi?.wickets || 0}</strong></div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px] py-4 text-center">Never appeared in official ODI cricket</p>
                  )}
                </div>

                {/* T20I Stats */}
                <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-display font-bold text-sm text-cyan-400 block border-b border-white/5 pb-1">
                    T20 INTERNATIONAL RECORD
                  </span>
                  {player.formatEligibility?.t20 ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between"><span>Matches:</span> <strong className="text-white">{player.internationalStats?.t20i?.matches || 0}</strong></div>
                      <div className="flex justify-between"><span>Runs:</span> <strong className="text-white">{player.internationalStats?.t20i?.runs || 0}</strong></div>
                      <div className="flex justify-between"><span>Strike Rate:</span> <strong className="text-gold-400">{player.internationalStats?.t20i?.strikeRate || 0}</strong></div>
                      <div className="flex justify-between"><span>Batting Avg:</span> <strong className="text-pitch-400">{player.internationalStats?.t20i?.average || 0}</strong></div>
                      <div className="flex justify-between"><span>Fifties (50s):</span> <strong className="text-white">{player.internationalStats?.t20i?.fifties || 0}</strong></div>
                      <div className="flex justify-between"><span>Wickets:</span> <strong className="text-cyan-400">{player.internationalStats?.t20i?.wickets || 0}</strong></div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px] py-4 text-center">Never appeared in official T20 International</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Franchise & Domestic Statistics */}
          {activeTab === 'domestic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {/* Franchise (IPL) */}
                <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-display font-bold text-sm text-amber-400 block border-b border-white/5 pb-1">
                    IPL & FRANCHISE LEAGUE RECORD
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span>Franchises:</span> <strong className="text-white">{player.franchiseDomesticStats?.ipl?.teams?.join(', ') || player.franchise || 'Unsold'}</strong></div>
                    <div className="flex justify-between"><span>Matches:</span> <strong className="text-white">{player.franchiseDomesticStats?.ipl?.matches || 0}</strong></div>
                    <div className="flex justify-between"><span>Runs:</span> <strong className="text-white">{player.franchiseDomesticStats?.ipl?.runs || 0}</strong></div>
                    <div className="flex justify-between"><span>Strike Rate:</span> <strong className="text-gold-400">{player.franchiseDomesticStats?.ipl?.strikeRate || 0}</strong></div>
                    <div className="flex justify-between"><span>Wickets:</span> <strong className="text-cyan-400">{player.franchiseDomesticStats?.ipl?.wickets || 0}</strong></div>
                    <div className="flex justify-between"><span>IPL Titles:</span> <strong className="text-pitch-400">{player.franchiseDomesticStats?.ipl?.titles || 0} 🏆</strong></div>
                  </div>
                </div>

                {/* Domestic / First Class */}
                <div className="bg-stadium-950 p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-display font-bold text-sm text-slate-300 block border-b border-white/5 pb-1">
                    FIRST CLASS & LIST A DOMESTIC
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span>Domestic Teams:</span> <strong className="text-white">{player.franchiseDomesticStats?.domestic?.teams?.join(', ') || player.country}</strong></div>
                    <div className="flex justify-between"><span>First Class Matches:</span> <strong className="text-white">{player.franchiseDomesticStats?.domestic?.firstClassMatches || 0}</strong></div>
                    <div className="flex justify-between"><span>List A Matches:</span> <strong className="text-white">{player.franchiseDomesticStats?.domestic?.listAMatches || 0}</strong></div>
                    <div className="flex justify-between"><span>Career Runs:</span> <strong className="text-gold-400">{player.franchiseDomesticStats?.domestic?.totalRuns || 0}</strong></div>
                    <div className="flex justify-between"><span>Career Wickets:</span> <strong className="text-pitch-400">{player.franchiseDomesticStats?.domestic?.totalWickets || 0}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal Image Attribution Footer */}
          <div className="p-3 bg-stadium-950 rounded-xl border border-white/5 text-[10px] font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              📷 Image Source: <strong className="text-slate-200">{player.imageSource || 'Wikimedia Commons'}</strong> • Credit: <strong className="text-slate-200">{player.attribution}</strong>
            </span>
            <span className="text-gold-400 font-bold">
              Licence: {player.licenceInfo || 'CC BY-SA 4.0'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
