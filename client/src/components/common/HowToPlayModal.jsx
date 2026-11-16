import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, Flame, Shield, Play, HelpCircle, CheckCircle2 } from 'lucide-react';
import { sound } from '../../services/sound';

export const HowToPlayModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '01',
      title: 'Create or Join Room',
      icon: Users,
      badge: 'Min 2 • Max 6 Players',
      desc: 'Host creates a private room and shares the invitation link. Friends choose "JOIN AS PLAYER" (up to 6) or "JOIN AS SPECTATOR" (unlimited spectators who watch live).'
    },
    {
      num: '02',
      title: 'Format & Purse Points',
      icon: Trophy,
      badge: '50 / 40 / 30 Points',
      desc: 'TEST: 50 points purse per team. ODI: 40 points purse. T20: 30 points purse. No complicated currencies — pure points-based bidding.'
    },
    {
      num: '03',
      title: 'Host Stadium Selection',
      icon: Shield,
      badge: '15 Authentic Grounds',
      desc: "Host chooses from 15 iconic venues (Lord's, MCG, Eden Gardens, Wankhede, Chepauk, etc.). Pitch conditions (Green, Flat, Turning, Dry) directly affect pace bounce and spin."
    },
    {
      num: '04',
      title: 'Live Hammer Auction',
      icon: Flame,
      badge: '1 Pt Base • 2 T2 Vetoes',
      desc: 'Every cricketer starts at exactly 1 point with 1 pt increments. Unique player rule: each cricketer can appear only once. Use your 2 T2 Veto tokens wisely to cancel nominations.'
    },
    {
      num: '05',
      title: 'Build Playing XI',
      icon: CheckCircle2,
      badge: '11 Players • (C) & (WK)',
      desc: 'Pick your 11 from your auctioned squad, designate Captain (C), Vice-Captain (VC), Wicketkeeper (WK), and primary bowlers.'
    },
    {
      num: '06',
      title: 'Playable 2D Cricket Match',
      icon: Play,
      badge: 'Phaser 3 Game Engine',
      desc: 'Play live 2D cricket! Bowl with line, length and swing/spin variations. Bat using shot selection (Drive, Pull, Cut, Loft, Block) with real-time timing bar. Run singles, score 4s & 6s, and lift the trophy!'
    }
  ];

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-heading"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stadium-800 bg-stadium-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 id="how-to-play-heading" className="font-display text-xl font-black uppercase text-white tracking-wide">
                  HOW TO PLAY CRICKETVERSE
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  SIMPLE RULES • MULTIPLAYER BATTLES • LIVE SPECTATORS
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              aria-label="Close how to play modal"
              className="p-2 text-slate-400 hover:text-white hover:bg-stadium-800 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((st) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.num}
                    className="p-4 rounded-2xl bg-stadium-950/80 border border-stadium-800 hover:border-gold-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-black text-2xl text-gold-400/80">
                        {st.num}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/30">
                        {st.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-gold-400" />
                      <h3 className="font-display font-bold text-sm uppercase text-white">
                        {st.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-center">
              <p className="font-display font-bold text-xs uppercase text-gold-300 tracking-wide">
                ⚡ THAT IS CRICKETVERSE: CREATE ROOM • AUCTION PLAYERS • BUILD XI • PLAY MATCH • SPECTATE LIVE
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stadium-800 bg-stadium-950/60 flex justify-end">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-gold-glow focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:outline-none"
            >
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

