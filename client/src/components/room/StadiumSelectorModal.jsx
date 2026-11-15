import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Shield, Sparkles, MapPin, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { sound } from '../../services/sound';
import { StadiumCard } from './StadiumCard';
import { STADIUMS } from '../../data/stadiumsData';

export const StadiumSelectorModal = ({
  isOpen,
  onClose,
  roomCode,
  isHost,
  currentStadiumId = 'lords',
  onStadiumConfirmed
}) => {
  const [stadiums, setStadiums] = useState(STADIUMS);
  const [selectedStadium, setSelectedStadium] = useState(() => STADIUMS.find(s => s.id === currentStadiumId) || STADIUMS[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchStadiums = async () => {
      try {
        const res = await api.getStadiums();
        if (res.success && res.stadiums) {
          if (!mounted) return;
          setStadiums(res.stadiums);
          const current = res.stadiums.find(s => s.id === currentStadiumId) || res.stadiums[0];
          setSelectedStadium(current);
        }
      } catch (err) {
        console.error('Error fetching stadiums:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (isOpen) {
      fetchStadiums();
    }

    return () => {
      mounted = false;
    };
  }, [isOpen, currentStadiumId]);

  if (!isOpen) return null;

  const handleSelect = (stadium) => {
    if (!isHost) return;
    sound.playClick();
    setSelectedStadium(stadium);
  };

  const handleConfirm = async () => {
    if (!selectedStadium || !isHost) return;
    sound.playClick();
    setSaving(true);

    try {
      // 1. Update room settings via API
      await api.updateRoomSettings(roomCode, {
        stadiumId: selectedStadium.id,
        stadium: selectedStadium,
        stadiumName: selectedStadium.fullName || selectedStadium.name
      });

      // 2. Emit via Socket to synchronize in real time to all participants & spectators
      socketService.selectStadium(roomCode, selectedStadium.id);

      if (onStadiumConfirmed) {
        onStadiumConfirmed(selectedStadium);
      }
      onClose();
    } catch (err) {
      console.error('Error saving stadium selection:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stadium-800 bg-stadium-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-black uppercase text-white tracking-wide">
                  HOST STADIUM SELECTION
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  {isHost
                    ? 'SELECT 1 ICONIC GROUND FOR THE MATCH • REAL PITCH & BOUNDARY EFFECTS'
                    : 'VIEWING HOST-SELECTED GROUND (HOST PERMISSION REQUIRED TO CHANGE)'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-stadium-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Stadium Grid + Preview Sidebar */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Live Preview of Selected Stadium */}
            {selectedStadium && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-stadium-950 via-stadium-900 to-amber-950/40 border border-gold-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-stadium-800 flex-shrink-0">
                    <img
                      src={selectedStadium.imageUrl}
                      alt={selectedStadium.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-wider block">
                      PREVIEW SELECTED VENUE
                    </span>
                    <h3 className="font-display font-black text-lg uppercase text-white">
                      {selectedStadium.fullName || selectedStadium.name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {selectedStadium.city}, {selectedStadium.country} • {selectedStadium.pitchType} Pitch • Pace: {selectedStadium.paceSupport}% • Spin: {selectedStadium.spinSupport}%
                    </p>
                  </div>
                </div>

                {isHost ? (
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? 'CONFIRMING...' : 'CONFIRM STADIUM SELECTION'}
                  </button>
                ) : (
                  <span className="text-xs font-mono text-slate-400 bg-stadium-950 px-3 py-1.5 rounded-lg border border-stadium-800">
                    Host decides stadium
                  </span>
                )}
              </div>
            )}

            {/* 15 Stadium Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stadiums.map((stad) => (
                <StadiumCard
                  key={stad.id}
                  stadium={stad}
                  isSelected={selectedStadium?.id === stad.id}
                  isHost={isHost}
                  onSelect={handleSelect}
                  showFullDetails={true}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

