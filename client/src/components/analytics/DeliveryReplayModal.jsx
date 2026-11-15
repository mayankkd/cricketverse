import React, { useState } from 'react';
import { X, Play, RotateCcw, Volume2, Sparkles, MessageSquare } from 'lucide-react';
import commentaryTTS from '../../services/commentaryTTS';

export default function DeliveryReplayModal({ isOpen, onClose, highlight }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePersona, setActivePersona] = useState('Professional');

  if (!isOpen || !highlight) return null;

  const commentaryText = typeof highlight.commentary === 'object'
    ? (highlight.commentary[activePersona] || highlight.commentary.professional || highlight.commentary.text || highlight.title)
    : (highlight.commentary || highlight.title);

  const handlePlayTTS = () => {
    commentaryTTS.toggleTTS(true);
    commentaryTTS.speak(commentaryText, activePersona);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              highlight.badge === 'SIX' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              highlight.badge === 'FOUR' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {highlight.badge || 'HIGHLIGHT'}
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Over {highlight.over} Delivery Replay</h3>
              <p className="text-xs text-slate-400">{highlight.striker} vs {highlight.bowler}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2D Animated Broadcast Replay Screen */}
        <div className="relative w-full h-48 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/40 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
          {/* Pitch Lines */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-20 bg-amber-900/40 border-y border-amber-600/30 rounded-lg flex items-center justify-between px-6">
            {/* Bowler End */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-[10px] text-blue-300 font-bold mb-1">
                BOW
              </div>
              <span className="text-[9px] text-slate-400">{highlight.bowler}</span>
            </div>

            {/* Ball Trajectory Animation */}
            <div className="flex-1 relative mx-4 h-12 flex items-center">
              <div className="w-full border-t-2 border-dashed border-amber-400/40 absolute top-1/2"></div>
              {/* Animated Ball */}
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-bounce mx-auto"></div>
            </div>

            {/* Batter End */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-[10px] text-emerald-300 font-bold mb-1">
                BAT
              </div>
              <span className="text-[9px] text-slate-400">{highlight.striker}</span>
            </div>
          </div>

          {/* Delivery Tag Overlay */}
          <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300">
            Shot: <span className="text-white font-bold">{highlight.deliveryData?.shotType || 'Lofted Drive'}</span> • Direction: <span className="text-cyan-400 font-bold">{highlight.deliveryData?.direction || 'Long-on'}</span>
          </div>

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay
            </button>
          </div>
        </div>

        {/* Multi-Personality Commentary Strip */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Commentary Style:</span>
            </div>

            {/* Persona Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
              {['Professional', 'Hype', 'Savage'].map(p => (
                <button
                  key={p}
                  onClick={() => setActivePersona(p)}
                  className={`px-2 py-0.5 rounded transition-colors text-[11px] ${
                    activePersona === p
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Commentary Text */}
          <p className="text-sm text-slate-200 leading-relaxed font-serif italic py-1">
            "{commentaryText}"
          </p>

          {/* Text-To-Speech Button */}
          <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-800/60">
            <button
              onClick={handlePlayTTS}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Listen with Voice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
