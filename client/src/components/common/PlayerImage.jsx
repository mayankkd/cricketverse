import React, { useState } from 'react';
import { Shield, Info, Sparkles } from 'lucide-react';

export const PlayerImage = ({
  player,
  className = 'w-full h-full object-cover object-top',
  showAttribution = false,
  format = 't20'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showCreditTooltip, setShowCreditTooltip] = useState(false);

  if (!player) return null;

  // Determine image URL (format-specific if available, else primary imageUrl or avatarUrl)
  const formatKey = (format || 't20').toLowerCase();
  const formatImg = player.formatSpecificImage?.[formatKey];
  const photoUrl = formatImg || player.imageUrl || player.avatarUrl;

  const getInitials = () => {
    if (typeof player.shortName === 'string' && player.shortName.trim().length > 0) {
      const parts = player.shortName.trim().split(/\s+/).map(p => p[0] || '').join('');
      return (parts.slice(0, 3) || 'CR').toUpperCase();
    }
    const nameStr = (typeof player.name === 'string' && player.name.trim().length > 0)
      ? player.name.trim()
      : (typeof player.playerName === 'string' && player.playerName.trim().length > 0)
      ? player.playerName.trim()
      : 'CR';
    return nameStr.slice(0, 2).toUpperCase();
  };

  const initials = getInitials();

  const countryGradients = {
    India: 'from-blue-900 via-slate-900 to-amber-950',
    Australia: 'from-amber-600 via-slate-900 to-emerald-950',
    'West Indies': 'from-red-900 via-slate-900 to-yellow-950',
    England: 'from-blue-950 via-slate-900 to-red-950',
    'South Africa': 'from-emerald-900 via-slate-900 to-yellow-950',
    Pakistan: 'from-emerald-950 via-slate-900 to-green-950',
    'New Zealand': 'from-slate-950 via-slate-900 to-zinc-950',
    'Sri Lanka': 'from-blue-900 via-slate-900 to-yellow-950',
    Afghanistan: 'from-blue-950 via-red-950 to-slate-950'
  };

  const gradientClass = countryGradients[player.country] || 'from-stadium-900 via-stadium-850 to-stadium-950';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-stadium-950">
      {/* Loading Skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-stadium-900 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-400 animate-spin" />
        </div>
      )}

      {/* Actual Recognized Player Photograph */}
      {photoUrl && !imageError ? (
        <img
          src={photoUrl}
          alt={player.name || player.playerName || 'Player'}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`${className} transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {/* Bespoke Styled Fallback Badge (renders if image fails or missing - NEVER broken placeholder) */}
      {imageError && (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-3 text-center select-none border border-white/10`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg mb-1">
            <span className="font-display font-black text-xl text-white tracking-widest">
              {initials}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gold-400 font-bold uppercase mt-1">
            #{player.jerseyNumber || 18} • {player.countryFlag || '🏏'}
          </span>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate max-w-[90%]">
            {player.shortName || player.name || player.playerName || 'Cricketer'}
          </span>
        </div>
      )}

      {/* Legal Attribution Pill */}
      {showAttribution && (player.attribution || player.imageSource) && (
        <div className="absolute bottom-1 right-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCreditTooltip(!showCreditTooltip);
            }}
            aria-label={`Photo licence attribution for ${player.name || player.playerName || 'player'}`}
            className="p-1 rounded-md bg-stadium-950/80 hover:bg-stadium-900 text-slate-400 hover:text-gold-300 border border-white/10 backdrop-blur-sm transition-colors text-[9px] focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:outline-none"
            title="Image Source & Legal Licence Information"
          >
            <Info className="w-3 h-3" />
          </button>

          {showCreditTooltip && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-6 right-0 w-48 p-2 rounded-xl bg-stadium-900 border border-stadium-700 shadow-2xl text-[10px] font-mono text-slate-300 z-50 backdrop-blur-md"
            >
              <p className="font-bold text-white mb-0.5 truncate">📷 {player.name || player.playerName || 'Cricketer'}</p>
              <p className="text-slate-400 truncate">Source: {player.imageSource || 'Wikimedia Commons'}</p>
              <p className="text-slate-400 truncate">Credit: {player.attribution || 'Open Media Archive'}</p>
              <p className="text-gold-400 font-bold mt-1">Licence: {player.licenceInfo || 'CC BY-SA 4.0'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

