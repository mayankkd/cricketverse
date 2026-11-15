import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Zap,
  Activity,
  Heart,
  Shield,
  Award,
  Sparkles,
  TrendingUp,
  X,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Dumbbell,
  Target,
  Brain,
  Crown
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';

export const PlayerDevelopmentModal = ({ player, isOpen, onClose, onUpdate }) => {
  const [development, setDevelopment] = useState(null);
  const [specialAbilities, setSpecialAbilities] = useState([]);
  const [chemistryTags, setChemistryTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const playerId = player?._id || player?.playerId;

  const loadDevelopmentData = async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const res = await api.getPlayerDevelopment(playerId);
      if (res.success) {
        setDevelopment(res.development);
        setSpecialAbilities(res.specialAbilities || []);
        setChemistryTags(res.chemistryTags || []);
      }
    } catch (err) {
      console.error('Failed to load player development:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && playerId) {
      loadDevelopmentData();
    }
  }, [isOpen, playerId]);

  // Execute Training Drill
  const handleTrain = async (drillType) => {
    sound.playClick();
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.trainPlayer(playerId, drillType);
      if (res.success) {
        sound.playGavelStrike();
        setDevelopment(res.player?.development);
        setFeedbackMsg(res.message);
        if (onUpdate) onUpdate(res.player);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      alert(err.message || 'Training failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Recovery Action
  const handleRecover = async (method) => {
    sound.playClick();
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.recoverPlayer(playerId, method);
      if (res.success) {
        sound.playSixHit();
        setDevelopment(res.development);
        setFeedbackMsg(res.message);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      alert(err.message || 'Recovery action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const formVal = development?.form || 85;
  const confVal = development?.confidence || 80;
  const fitVal = development?.fitness || 90;
  const fatigueVal = development?.fatigue || 10;
  const injury = development?.injury || { status: 'healthy', injuryRisk: 10 };
  const training = development?.training || { level: 1 };

  const getFormBadge = (val) => {
    if (val >= 95) return { label: 'ON FIRE 🔥', color: 'bg-red-500 text-white' };
    if (val >= 85) return { label: 'IN FORM ⚡', color: 'bg-amber-400 text-slate-950 font-black' };
    if (val >= 70) return { label: 'STEADY', color: 'bg-pitch-500 text-slate-950' };
    return { label: 'SLUMP ❄️', color: 'bg-blue-500 text-white' };
  };

  const formBadge = getFormBadge(formVal);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-stadium-900 border border-gold-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stadium-950 border border-gold-500/30 overflow-hidden flex-shrink-0">
            {player?.imageUrl ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🏏</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-gold-500/20 text-gold-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                PLAYER DEVELOPMENT • PHASE 12
              </span>
              <span className={`text-[10px] font-display uppercase font-black px-2 py-0.5 rounded shadow ${formBadge.color}`}>
                {formBadge.label}
              </span>
              <span className="text-[10px] font-mono bg-pitch-500/20 text-pitch-300 px-2 py-0.5 rounded border border-pitch-500/30">
                LEVEL {training.level || 1}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl text-white uppercase">
              {player?.name}
            </h2>
            <p className="text-xs font-mono text-slate-400">
              {player?.role} • {player?.country} • OVR {player?.overallRating || 95}
            </p>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {feedbackMsg && (
          <div className="p-3 rounded-2xl bg-pitch-500/10 border border-pitch-500/40 text-pitch-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-pitch-400 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Primary Readiness & Vitality Metrics (Form, Confidence, Fitness, Fatigue, Injury Risk) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Form */}
          <div className="p-3 bg-stadium-950 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>Match Form</span>
              <Flame className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-xl font-display font-black text-amber-400">{formVal} / 100</div>
            <div className="w-full h-1.5 bg-stadium-900 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${formVal}%` }} />
            </div>
          </div>

          {/* Confidence */}
          <div className="p-3 bg-stadium-950 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>Confidence</span>
              <Zap className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-xl font-display font-black text-cyan-400">{confVal} / 100</div>
            <div className="w-full h-1.5 bg-stadium-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${confVal}%` }} />
            </div>
          </div>

          {/* Fitness */}
          <div className="p-3 bg-stadium-950 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>Stamina</span>
              <Heart className="w-3 h-3 text-pitch-400" />
            </div>
            <div className="text-xl font-display font-black text-pitch-400">{fitVal} / 100</div>
            <div className="w-full h-1.5 bg-stadium-900 rounded-full overflow-hidden">
              <div className="h-full bg-pitch-400 rounded-full" style={{ width: `${fitVal}%` }} />
            </div>
          </div>

          {/* Fatigue & Injury */}
          <div className="p-3 bg-stadium-950 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>Fatigue Workload</span>
              <Activity className="w-3 h-3 text-red-400" />
            </div>
            <div className="text-xl font-display font-black text-red-400">{fatigueVal} / 100</div>
            <div className="w-full h-1.5 bg-stadium-900 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${fatigueVal}%` }} />
            </div>
          </div>
        </div>

        {/* Injury Status Banner */}
        <div className="p-3 rounded-2xl bg-stadium-950 border border-white/5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold-400" />
            <span>
              Medical Status: <strong className="text-pitch-400 uppercase">{injury.status || 'HEALTHY'}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Injury Risk Index: <strong className="text-amber-400">{injury.injuryRisk || 10}%</strong>
          </span>
        </div>

        {/* 6 TRAINING DRILLS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-sm uppercase text-white flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-gold-400" /> ACADEMY TRAINING DRILLS (EARN XP & STAT BUFFS)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Training Level {training.level || 1}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'Batting', name: 'Batting Nets', icon: '🏏', desc: '+Batting & Power Hitting' },
              { id: 'Bowling', name: 'Bowling Spell', icon: '🎯', desc: '+Pace & Death Bowling' },
              { id: 'Fielding', name: 'Fielding Drills', icon: '⚡', desc: '+Catching & Agility' },
              { id: 'Fitness', name: 'Fitness Gym', icon: '💪', desc: '-Fatigue & +Stamina' },
              { id: 'Mental Strength', name: 'Mental Composure', icon: '🧠', desc: '+Temperament & Focus' },
              { id: 'Captaincy', name: 'Captaincy Class', icon: '👑', desc: '+Tactical Adjustments' }
            ].map(drill => (
              <button
                key={drill.id}
                disabled={actionLoading}
                onClick={() => handleTrain(drill.id)}
                className="p-3 rounded-2xl bg-stadium-950 border border-white/5 hover:border-gold-500/40 text-left transition-all active:scale-95 group disabled:opacity-40"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{drill.icon}</span>
                  <span className="text-[9px] font-mono font-bold text-gold-400 group-hover:underline">
                    TRAIN ↵
                  </span>
                </div>
                <div className="font-display font-bold text-xs text-white uppercase">{drill.name}</div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5">{drill.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* RECOVERY & PHYSIO ACTIONS */}
        <div className="space-y-3 pt-2 border-t border-stadium-800">
          <h3 className="font-display font-black text-sm uppercase text-white flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pitch-400" /> SPORTS SCIENCE RECOVERY & WORKLOAD REHAB
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'physio', name: 'Physio Session', desc: '-25 Fatigue, Clears Strains' },
              { id: 'ice_bath', name: 'Cryo Ice Bath', desc: '-35 Fatigue, Muscle Reset' },
              { id: 'rest_cycle', name: 'Full Rest Day', desc: '100% Stamina Reset' },
              { id: 'rehab', name: 'Medical Rehab', desc: 'Accelerate Injury Healing' }
            ].map(rec => (
              <button
                key={rec.id}
                disabled={actionLoading}
                onClick={() => handleRecover(rec.id)}
                className="p-2.5 rounded-xl bg-stadium-950 border border-pitch-500/20 hover:border-pitch-400 text-left transition-colors active:scale-95 disabled:opacity-40"
              >
                <div className="font-display font-bold text-xs text-pitch-300 uppercase">{rec.name}</div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5">{rec.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 8 SPECIAL ABILITIES */}
        <div className="space-y-3 pt-2 border-t border-stadium-800">
          <h3 className="font-display font-black text-sm uppercase text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> SPECIAL ABILITIES & SIGNATURE TRAITS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {specialAbilities.length > 0 ? (
              specialAbilities.map(ability => (
                <div
                  key={ability}
                  className="p-3 bg-gradient-to-r from-amber-500/10 to-stadium-950 border border-amber-500/30 rounded-2xl flex items-center gap-3"
                >
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h4 className="font-display font-black text-xs text-amber-400 uppercase">{ability}</h4>
                    <p className="text-[10px] font-mono text-slate-300">
                      Signature cricket ability unlocked. Triggers automatically during high-leverage deliveries.
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-stadium-950 rounded-2xl border border-white/5 text-slate-500 text-xs font-mono">
                Train player to unlock unique special abilities.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
