import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Flame,
  Target,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles
} from 'lucide-react';
import { InteractiveField } from './InteractiveField';
import { BattingStrategyPanel } from './BattingStrategyPanel';
import { BowlingStrategyPanel } from './BowlingStrategyPanel';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

export const TacticalManagementModal = ({
  isOpen,
  onClose,
  teamId,
  matchId,
  teamKey = 'teamA',
  initialTactics,
  playingXI = [],
  format = 'T20',
  isReadOnly = false,
  tacticalBreak = 'live',
  onSaveSuccess
}) => {
  const [activeTab, setActiveTab] = useState('field'); // 'field' | 'batting' | 'bowling'
  const [tactics, setTactics] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (initialTactics) {
      setTactics(initialTactics);
    } else if (teamId && isOpen) {
      const fetchTeamTactics = async () => {
        try {
          const res = await api.getTeamTactics(teamId);
          if (res.success && res.tactics) {
            setTactics(res.tactics);
          }
        } catch (err) {
          console.error('Error fetching team tactics:', err);
        }
      };
      fetchTeamTactics();
    }
  }, [initialTactics, teamId, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isReadOnly || saving) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      sound.playClick();
      let res;
      if (matchId) {
        res = await api.updateMatchTactics(matchId, {
          teamKey,
          tactics,
          tacticalBreak
        });
      } else if (teamId) {
        res = await api.updateTeamTactics(teamId, tactics);
      }

      if (res && res.success) {
        setSuccessMsg('Tactical changes deployed successfully!');
        if (onSaveSuccess) onSaveSuccess(tactics);
        setTimeout(() => {
          setSuccessMsg(null);
        }, 3000);
      } else {
        setErrorMsg(res?.message || 'Failed to update tactics. Please review field restrictions.');
      }
    } catch (err) {
      console.error('Tactics save error:', err);
      setErrorMsg(err.message || 'Error updating tactics.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-stadium-900 border border-gold-500/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-stadium-800 bg-stadium-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">
                  TACTICAL MANAGEMENT CENTER
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-pitch-950 text-pitch-400 border border-pitch-500/30">
                  {tacticalBreak ? tacticalBreak.replace('_', ' ') : 'LIVE'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Format: <strong className="text-gold-400">{format}</strong> • 18 Field Positions • 6 Batting Tempos • Delivery Physics
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-stadium-900 hover:bg-stadium-800 text-slate-400 hover:text-white flex items-center justify-center border border-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex border-b border-stadium-800 bg-stadium-950 px-6">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('field');
            }}
            className={`flex items-center gap-2 py-3.5 px-4 font-display font-bold text-xs uppercase border-b-2 transition-all ${
              activeTab === 'field'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            FIELD PLACEMENT (18 ZONES)
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('batting');
            }}
            className={`flex items-center gap-2 py-3.5 px-4 font-display font-bold text-xs uppercase border-b-2 transition-all ${
              activeTab === 'batting'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            BATTING STRATEGIES
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('bowling');
            }}
            className={`flex items-center gap-2 py-3.5 px-4 font-display font-bold text-xs uppercase border-b-2 transition-all ${
              activeTab === 'bowling'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            BOWLING PLANS & DELIVERY TACTICS
          </button>
        </div>

        {/* Alerts / Error & Success Banners */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-xs font-mono text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-xs font-mono text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Tab Content */}
        <div className="p-6 max-h-[68vh] overflow-y-auto">
          {tactics && (
            <>
              {activeTab === 'field' && (
                <InteractiveField
                  positions={tactics.fieldPlacement?.positions || []}
                  preset={tactics.fieldPlacement?.preset || 'Powerplay'}
                  onPresetChange={(preset) => {
                    setTactics(prev => ({
                      ...prev,
                      fieldPlacement: {
                        ...(prev?.fieldPlacement || {}),
                        preset
                      }
                    }));
                  }}
                  onChange={(newPositions) => {
                    setTactics(prev => ({
                      ...prev,
                      fieldPlacement: {
                        ...(prev?.fieldPlacement || {}),
                        positions: newPositions
                      }
                    }));
                  }}
                  availableFielders={playingXI}
                  format={format}
                  isPowerplay={tactics.fieldPlacement?.preset === 'Powerplay'}
                  isReadOnly={isReadOnly}
                />
              )}

              {activeTab === 'batting' && (
                <BattingStrategyPanel
                  battingTactics={tactics.batting || {}}
                  playingXI={playingXI}
                  onChange={(newBatting) => {
                    setTactics(prev => ({
                      ...prev,
                      batting: newBatting
                    }));
                  }}
                  isReadOnly={isReadOnly}
                />
              )}

              {activeTab === 'bowling' && (
                <BowlingStrategyPanel
                  bowlingTactics={tactics.bowling || {}}
                  playingXI={playingXI}
                  format={format}
                  onChange={(newBowling) => {
                    setTactics(prev => ({
                      ...prev,
                      bowling: newBowling
                    }));
                  }}
                  isReadOnly={isReadOnly}
                />
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-stadium-800 bg-stadium-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs font-mono text-slate-400">
            {isReadOnly ? (
              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Lock className="w-3.5 h-3.5" /> Spectator Mode: Viewing tactical configurations
              </span>
            ) : (
              <span>Tactics will influence real-time deliveries, catches, edges, and boundary probabilities.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl border border-stadium-700 bg-stadium-900 hover:bg-stadium-800 text-slate-300 font-display uppercase font-bold text-xs"
            >
              CLOSE
            </button>

            {!isReadOnly && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-slate-950 font-display uppercase font-bold text-xs px-6 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-2 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                {saving ? 'DEPLOYING TACTICS...' : 'SAVE & DEPLOY TACTICS'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

