import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Radio,
  CheckCircle2,
  XCircle,
  X,
  RotateCw,
  Volume2
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';

export const DrsSnickometerModal = ({ matchId, isOpen, onClose }) => {
  const [drsData, setDrsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewStage, setReviewStage] = useState('tracking'); // 'tracking', 'ultraedge', 'verdict'

  useEffect(() => {
    if (isOpen && matchId) {
      setLoading(true);
      setReviewStage('tracking');
      sound.playDrsBeep();

      api.getDrsReview(matchId)
        .then(res => {
          if (res.success && res.drsReview) {
            setDrsData(res.drsReview);
            setTimeout(() => setReviewStage('ultraedge'), 1400);
            setTimeout(() => {
              setReviewStage('verdict');
              if (res.drsReview.finalDecision === 'OUT') sound.playCrowdRoar();
              else sound.playCrowdGasp();
            }, 3000);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-stadium-900 border-2 border-red-500/60 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-display font-black text-xs uppercase text-red-400">
              THIRD UMPIRE DRS REVIEW IN PROGRESS
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase bg-stadium-950 px-2.5 py-1 rounded-full border border-white/5">
            HAWKEYE TELEMETRY
          </span>
        </div>

        {loading || !drsData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-red-400 font-mono text-xs">
            <RotateCw className="w-6 h-6 animate-spin text-red-400" />
            <span>CONNECTING TO ULTRAEDGE HIGH-SPEED CAMERAS...</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Stage Indicator */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono uppercase">
              <span className={`p-2 rounded-xl border ${reviewStage === 'tracking' ? 'bg-red-500/20 text-red-300 border-red-500' : 'bg-stadium-950 text-slate-500 border-white/5'}`}>
                1. Ball Tracking
              </span>
              <span className={`p-2 rounded-xl border ${reviewStage === 'ultraedge' ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-stadium-950 text-slate-500 border-white/5'}`}>
                2. UltraEdge Audio
              </span>
              <span className={`p-2 rounded-xl border ${reviewStage === 'verdict' ? 'bg-pitch-500/20 text-pitch-300 border-pitch-500 font-bold' : 'bg-stadium-950 text-slate-500 border-white/5'}`}>
                3. Final Verdict
              </span>
            </div>

            {/* UltraEdge Waveform Simulation */}
            <div className="bg-stadium-950 p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" /> UltraEdge Snickometer Feed
                </span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {drsData.snickometerDecibels} dB Peak
                </span>
              </div>

              {/* Animated waveform bars */}
              <div className="h-20 bg-black/60 rounded-xl p-2 flex items-center justify-between gap-1 overflow-hidden">
                {(drsData.waveformSamples || []).map((sample, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ height: 4 }}
                    animate={{ height: `${Math.min(100, Math.max(8, sample))}%` }}
                    transition={{ duration: 0.3, delay: idx * 0.02 }}
                    className={`w-full rounded-sm transition-all ${
                      drsData.ultraEdgeSpike && (idx >= 14 && idx <= 18)
                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                        : 'bg-pitch-500/60'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Pre-Impact</span>
                <span className="text-red-400 font-bold">Bat Passing Ball</span>
                <span>Follow-Through</span>
              </div>
            </div>

            {/* Ball Tracking Telemetry */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-3 bg-stadium-950 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Pitching</span>
                <span className="font-bold text-white">{drsData.ballTracking?.pitching}</span>
              </div>
              <div className="p-3 bg-stadium-950 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Impact</span>
                <span className="font-bold text-white">{drsData.ballTracking?.impact}</span>
              </div>
              <div className="p-3 bg-stadium-950 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Wickets</span>
                <span className={`font-bold ${drsData.ultraEdgeSpike ? 'text-red-400' : 'text-pitch-400'}`}>
                  {drsData.ballTracking?.wickets}
                </span>
              </div>
            </div>

            {/* Third Umpire Voice Recommendation */}
            <div className="p-3 bg-stadium-950 rounded-xl border border-white/5 text-xs font-mono text-slate-300 flex items-start gap-2.5">
              <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Third Umpire:</strong> "{drsData.umpireRecommendation}"
              </span>
            </div>

            {/* Big Screen Verdict Card */}
            {reviewStage === 'verdict' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-6 rounded-3xl text-center shadow-2xl font-display font-black text-4xl uppercase tracking-wider ${
                  drsData.finalDecision === 'OUT'
                    ? 'bg-red-600 text-white shadow-red-glow'
                    : 'bg-pitch-500 text-slate-950 shadow-green-glow'
                }`}
              >
                {drsData.finalDecision}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

