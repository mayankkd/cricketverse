import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Tv,
  Globe,
  Bell,
  Lock,
  Save,
  CheckCircle2,
  Shield,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { sound } from '../services/sound';

export const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useNotification();

  const [soundEnabled, setSoundEnabled] = useState(
    user?.preferences?.soundEnabled !== undefined ? user.preferences.soundEnabled : true
  );
  const [commentaryLang, setCommentaryLang] = useState(
    user?.preferences?.commentaryLanguage || 'English (Harsha & Ravi)'
  );
  const [graphicsQuality, setGraphicsQuality] = useState(
    user?.preferences?.graphicsQuality || 'Ultra HDR'
  );
  const [simulationSpeed, setSimulationSpeed] = useState(
    user?.preferences?.simulationSpeed || 'Fast (2x)'
  );
  const [pushNotifs, setPushNotifs] = useState(
    user?.preferences?.pushNotifications !== undefined ? user.preferences.pushNotifications : true
  );

  const handleSave = async (e) => {
    e.preventDefault();
    sound.enabled = soundEnabled;
    sound.playClick();

    await updateUserProfile({
      preferences: {
        soundEnabled,
        commentaryLanguage: commentaryLang,
        graphicsQuality,
        simulationSpeed,
        pushNotifications: pushNotifs
      }
    });

    addToast({
      type: 'gold',
      title: 'SETTINGS UPDATED',
      message: 'Broadcasting & manager preferences synchronized.'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-black uppercase text-white tracking-wide">
            CRICKETVERSE SETTINGS
          </h1>
          <p className="text-xs font-mono text-slate-400">
            AUDIO, BROADCAST GRAPHICS & ENGINE PREFERENCES
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave}
        className="bg-stadium-900 border border-stadium-800 p-8 rounded-3xl shadow-xl space-y-6"
      >
        {/* Audio & Sound Effects */}
        <div className="space-y-3 pb-6 border-b border-stadium-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-stadium-950 text-gold-400">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-display font-bold text-sm uppercase text-white">Willow & Stadium Sound FX</h3>
                <p className="text-xs text-slate-400">Web Audio synthesis for bat cracks, crowd roar & auction chimes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !soundEnabled;
                setSoundEnabled(nextVal);
                sound.enabled = nextVal;
                if (nextVal) sound.playBidChime();
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                soundEnabled ? 'bg-gold-500' : 'bg-stadium-800'
              }`}
            >
              <div
                className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Commentary Language */}
        <div className="space-y-3 pb-6 border-b border-stadium-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-stadium-950 text-electric-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm uppercase text-white">Broadcast Commentary Feed</h3>
              <p className="text-xs text-slate-400">Voices and style for live match center ball commentary</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              'English (Harsha & Ravi)',
              'Hindi (Aakash & Sidhu)',
              'Aussie (Ponting & Warne)'
            ].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCommentaryLang(lang);
                }}
                className={`p-3 rounded-xl border text-left text-xs font-mono font-bold transition-all ${
                  commentaryLang === lang
                    ? 'bg-electric-500/10 border-electric-500 text-electric-400 shadow-electric-glow'
                    : 'bg-stadium-950 border-stadium-800 text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Simulation Speed & Graphics Quality */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-stadium-800">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-2">
              Match Simulation Pace
            </label>
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(e.target.value)}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="Normal (1x)">Normal (1x - 3s per ball)</option>
              <option value="Fast (2x)">Fast (2x - 1.5s per ball)</option>
              <option value="Turbo (5x)">Turbo Blitz (Instant replay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-2">
              Visual Render Graphics Quality
            </label>
            <select
              value={graphicsQuality}
              onChange={(e) => setGraphicsQuality(e.target.value)}
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="Ultra HDR">Ultra HDR (Full Stadium Glow & Beams)</option>
              <option value="High Quality">High Quality (Balanced 60FPS)</option>
              <option value="Performance">Performance Mode (Low GPU load)</option>
            </select>
          </div>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-stadium-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-stadium-950 text-pitch-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm uppercase text-white">Multiplayer Toast Notifications</h3>
              <p className="text-xs text-slate-400">Alerts when rivals bid in auctions or enter room lobbies</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPushNotifs(!pushNotifs)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              pushNotifs ? 'bg-pitch-500' : 'bg-stadium-800'
            }`}
          >
            <div
              className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                pushNotifs ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-8 py-3.5 rounded-xl shadow-gold-glow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" /> SAVE PREFERENCES
          </button>
        </div>
      </motion.form>
    </div>
  );
};
