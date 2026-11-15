import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Play,
  Pause,
  Award,
  Crown,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  RotateCw
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';
import { commentaryTTS } from '../../services/commentaryTTS';

export const MatchDocumentaryModal = ({ matchId, isOpen, onClose }) => {
  const [docData, setDocData] = useState(null);
  const [activeActIndex, setActiveActIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && matchId) {
      setLoading(true);
      api.getMatchDocumentary(matchId)
        .then(res => {
          if (res.success && res.documentary) {
            setDocData(res.documentary);
            setActiveActIndex(0);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, matchId]);

  const currentAct = docData?.acts?.[activeActIndex];

  // Play audio voiceover narration
  const toggleNarration = () => {
    if (!currentAct) return;
    if (isPlayingAudio) {
      commentaryTTS.stop();
      setIsPlayingAudio(false);
    } else {
      sound.playClick();
      setIsPlayingAudio(true);
      commentaryTTS.speak(
        `${currentAct.actTitle}. ${currentAct.narration}`,
        () => setIsPlayingAudio(false),
        'Professional'
      );
    }
  };

  const handleNextAct = () => {
    commentaryTTS.stop();
    setIsPlayingAudio(false);
    sound.playClick();
    if (activeActIndex < (docData?.acts?.length || 1) - 1) {
      setActiveActIndex(activeActIndex + 1);
    }
  };

  const handlePrevAct = () => {
    commentaryTTS.stop();
    setIsPlayingAudio(false);
    sound.playClick();
    if (activeActIndex > 0) {
      setActiveActIndex(activeActIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-stadium-900 border border-gold-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8"
      >
        <button
          onClick={() => {
            commentaryTTS.stop();
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="bg-gold-500/20 text-gold-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase flex items-center gap-1.5 w-fit">
            <Film className="w-3.5 h-3.5" /> CINEMATIC CRICKET DOCUMENTARY
          </span>
          <h2 className="font-display font-black text-2xl text-white uppercase mt-1">
            {docData?.title || 'The Historic CricketVerse Clash'}
          </h2>
          <p className="text-xs font-mono text-slate-400">
            {docData?.documentaryDuration || '12 Minutes Cut'} • {docData?.narrativeSummary}
          </p>
        </div>

        {loading || !docData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gold-400 font-mono text-xs">
            <RotateCw className="w-6 h-6 animate-spin text-gold-400" />
            <span>DIRECTING 5-ACT MATCH DOCUMENTARY SCRIPT...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Act Timeline Progress Bar */}
            <div className="flex items-center gap-1.5">
              {(docData.acts || []).map((act, idx) => (
                <button
                  key={act.actNumber}
                  onClick={() => {
                    commentaryTTS.stop();
                    setIsPlayingAudio(false);
                    sound.playClick();
                    setActiveActIndex(idx);
                  }}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    idx === activeActIndex
                      ? 'bg-gold-400 shadow-gold-glow'
                      : idx < activeActIndex
                      ? 'bg-amber-600'
                      : 'bg-stadium-950'
                  }`}
                  title={act.actTitle}
                />
              ))}
            </div>

            {/* Current Act Screen */}
            <AnimatePresence mode="wait">
              {currentAct && (
                <motion.div
                  key={currentAct.actNumber}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-stadium-950 p-6 rounded-3xl border border-white/5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gold-400 uppercase font-bold">
                      {currentAct.timeframe}
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-bold">
                      ACT {currentAct.actNumber} OF 5
                    </span>
                  </div>

                  <h3 className="font-display font-black text-xl text-white uppercase">
                    {currentAct.actTitle}
                  </h3>

                  <p className="text-sm font-serif italic text-slate-200 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5">
                    "{currentAct.narration}"
                  </p>

                  {/* Audio Narration Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={toggleNarration}
                      className={`px-4 py-2 rounded-xl text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-all ${
                        isPlayingAudio
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-gold-500 text-slate-950 shadow-gold-glow hover:bg-gold-400'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" /> STOP VOICE NARRATION
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" /> NARRATE ACT (TTS)
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={activeActIndex === 0}
                        onClick={handlePrevAct}
                        className="p-2 rounded-xl bg-stadium-900 text-slate-300 disabled:opacity-30 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={activeActIndex === (docData.acts?.length || 1) - 1}
                        onClick={handleNextAct}
                        className="p-2 rounded-xl bg-stadium-900 text-slate-300 disabled:opacity-30 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hero of the Match Spotlight */}
            {docData.heroOfTheMatch && (
              <div className="p-4 bg-gradient-to-r from-gold-500/10 via-stadium-950 to-stadium-950 rounded-2xl border border-gold-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-2xl">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gold-400 uppercase font-bold block">
                      DOCUMENTARY CENTRAL FIGURE
                    </span>
                    <h4 className="font-display font-black text-sm text-white uppercase">
                      {docData.heroOfTheMatch.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400">
                      {docData.heroOfTheMatch.impact}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

