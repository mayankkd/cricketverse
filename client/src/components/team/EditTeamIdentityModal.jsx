import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Palette, Save } from 'lucide-react';
import { sound } from '../../services/sound';

export const EditTeamIdentityModal = ({
  isOpen,
  onClose,
  team = null,
  onSave
}) => {
  const [name, setName] = useState(team?.name || '');
  const [shortCode, setShortCode] = useState(team?.shortCode || '');
  const [logo, setLogo] = useState(team?.logo || '🏏');
  const [logoUrl, setLogoUrl] = useState(team?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(team?.primaryColor || '#F59E0B');
  const [secondaryColor, setSecondaryColor] = useState(team?.secondaryColor || '#1E293B');

  if (!isOpen || !team) return null;

  const popularLogos = ['🏏', '🦁', '🐯', '👑', '⚡', '🦅', '🔥', '🛡️', '⚔️', '🌟'];

  const handleSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    onSave({
      name: name.trim() || team.name,
      shortCode: shortCode.trim().toUpperCase() || team.shortCode,
      logo,
      logoUrl: logoUrl.trim(),
      primaryColor,
      secondaryColor
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stadium-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-widest block">
                FRANCHISE BRANDING
              </span>
              <h3 className="font-display text-xl font-black uppercase text-white">
                EDIT TEAM IDENTITY
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stadium-800 hover:bg-stadium-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-5">
          {/* Team Name */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
              Franchise Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bangalore Royal Titans"
              className="w-full bg-stadium-950 border border-stadium-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
              required
            />
          </div>

          {/* Shortcode */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
              3-Letter Shortcode
            </label>
            <input
              type="text"
              maxLength={4}
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              placeholder="e.g. BRT"
              className="w-full bg-stadium-950 border border-stadium-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none uppercase"
              required
            />
          </div>

          {/* Logo Picker */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">
              Select Logo Crest
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularLogos.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => {
                    sound.playClick();
                    setLogo(emoji);
                  }}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                    logo === emoji
                      ? 'bg-gold-500/20 border-gold-400 scale-105 shadow-gold-glow'
                      : 'bg-stadium-950 border-stadium-800 hover:border-stadium-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Or paste custom image logo URL..."
              className="w-full bg-stadium-950 border border-stadium-700 focus:border-gold-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none mt-1"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Primary Jersey Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-slate-300">{primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Secondary Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-slate-300">{secondaryColor}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stadium-800">
            <button
              type="button"
              onClick={onClose}
              className="py-3 rounded-xl border border-stadium-700 text-slate-300 hover:bg-stadium-800 font-display font-bold uppercase text-xs"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-display font-black uppercase text-xs shadow-gold-glow flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> SAVE BRANDING
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

