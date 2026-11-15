import React, { useState } from 'react';
import { Shield, Wind, Compass, Sparkles } from 'lucide-react';

export const StadiumCard = ({
  stadium,
  isSelected = false,
  isHost = false,
  onSelect = null,
  showFullDetails = true
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!stadium) return null;

  const pitchTypeColors = {
    Green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    Flat: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    Turning: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    Dry: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    Cracked: 'bg-red-500/20 text-red-400 border-red-500/40'
  };

  const pitchBadge = pitchTypeColors[stadium.pitchType] || 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  return (
    <div
      onClick={() => {
        if (isHost && onSelect) {
          onSelect(stadium);
        }
      }}
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        isHost ? 'cursor-pointer hover:border-gold-500/70 hover:scale-[1.01]' : ''
      } ${
        isSelected
          ? 'bg-stadium-900 border-gold-400 shadow-gold-glow ring-2 ring-gold-400/50'
          : 'bg-stadium-950/80 border-stadium-800'
      }`}
    >
      {/* Stadium Photograph */}
      <div className="relative h-40 w-full overflow-hidden bg-stadium-900">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-stadium-900 animate-pulse flex items-center justify-center">
            <span className="text-2xl animate-spin">🏟️</span>
          </div>
        )}

        {stadium.imageUrl && !imgError ? (
          <img
            src={stadium.imageUrl}
            alt={stadium.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isSelected ? 'scale-105' : 'hover:scale-105'
            } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pitch-950 via-stadium-900 to-amber-950 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-1">🏟️</span>
            <span className="font-display font-black text-xs uppercase text-slate-300">
              {stadium.name}
            </span>
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-stadium-950 via-transparent to-black/40" />

        {/* Selected Pill */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 bg-gold-500 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase shadow-gold-glow flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> CHOSEN VENUE
          </div>
        )}

        {/* Pitch Type Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${pitchBadge}`}>
            {stadium.pitchType} Pitch
          </span>
        </div>

        {/* Bottom Bar on Photo */}
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <div>
            <h4 className="font-display font-black text-base uppercase text-white drop-shadow-md leading-tight">
              {stadium.fullName || stadium.name}
            </h4>
            <span className="text-[11px] font-mono text-slate-300 drop-shadow">
              {stadium.city}, {stadium.country}
            </span>
          </div>
        </div>
      </div>

      {/* Details & Ground Characteristics */}
      {showFullDetails && (
        <div className="p-4 space-y-3">
          {/* Characteristics description */}
          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
            {stadium.boundaryDimensions?.description || 'Authentic world cricket ground with dynamic pitch behavior.'}
          </p>

          {/* Pace & Spin Ratings */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stadium-800">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                <span>Pace Assistance</span>
                <span className="text-white font-bold">{stadium.paceSupport}%</span>
              </div>
              <div className="w-full bg-stadium-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-pitch-500 h-full rounded-full"
                  style={{ width: `${stadium.paceSupport}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                <span>Spin Assistance</span>
                <span className="text-white font-bold">{stadium.spinSupport}%</span>
              </div>
              <div className="w-full bg-stadium-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-electric-400 h-full rounded-full"
                  style={{ width: `${stadium.spinSupport}%` }}
                />
              </div>
            </div>
          </div>

          {/* Boundaries & Bounce */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-stadium-800/60">
            <span>
              Boundaries: <strong className="text-slate-200">{stadium.boundaryDimensions?.straight || 75}m S / {stadium.boundaryDimensions?.square || 65}m Sq</strong>
            </span>
            <span>
              Bounce: <strong className="text-gold-400">{stadium.bounce || 'True'}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
