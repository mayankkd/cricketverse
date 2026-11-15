import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, RotateCcw, Lock } from 'lucide-react';

// 18 Official fielding position coordinates & metadata (Scale 600x600 SVG)
// Center of pitch: (300, 300)
// Striker at bottom (300, 340), Bowler at top (300, 250), Wicketkeeper at (300, 385)
// Right-hand batter view: Screen-left (x < 300) = Off side, Screen-right (x > 300) = Leg/On side
export const FIELD_POSITIONS_MAP = {
  // --- INNER RING (Off Side) ---
  'Slip': { name: 'Slip', x: 265, y: 375, side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Second Slip': { name: 'Second Slip', x: 238, y: 382, side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Third Slip': { name: 'Third Slip', x: 212, y: 388, side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Gully': { name: 'Gully', x: 195, y: 355, side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Point': { name: 'Point', x: 185, y: 320, side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Cover': { name: 'Cover', x: 200, y: 265, side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Extra Cover': { name: 'Extra Cover', x: 228, y: 225, side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Mid-off': { name: 'Mid-off', x: 255, y: 195, side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },

  // --- INNER RING (Leg Side) ---
  'Mid-on': { name: 'Mid-on', x: 345, y: 195, side: 'leg', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Midwicket': { name: 'Midwicket', x: 395, y: 245, side: 'leg', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Square Leg': { name: 'Square Leg', x: 415, y: 325, side: 'leg', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Fine Leg': { name: 'Fine Leg', x: 385, y: 430, side: 'leg', ring: 'inner', isBehindSquare: true, isDeep: false },

  // --- DEEP BOUNDARY (Off Side) ---
  'Third Man': { name: 'Third Man', x: 145, y: 495, side: 'off', ring: 'deep', isBehindSquare: true, isDeep: true },
  'Deep Cover': { name: 'Deep Cover', x: 95, y: 260, side: 'off', ring: 'deep', isBehindSquare: false, isDeep: true },
  'Long-off': { name: 'Long-off', x: 215, y: 70, side: 'off', ring: 'deep', isBehindSquare: false, isDeep: true },

  // --- DEEP BOUNDARY (Leg Side) ---
  'Long-on': { name: 'Long-on', x: 385, y: 70, side: 'leg', ring: 'deep', isBehindSquare: false, isDeep: true },
  'Deep Midwicket': { name: 'Deep Midwicket', x: 495, y: 220, side: 'leg', ring: 'deep', isBehindSquare: false, isDeep: true },
  'Deep Square Leg': { name: 'Deep Square Leg', x: 505, y: 360, side: 'leg', ring: 'deep', isBehindSquare: true, isDeep: true }
};

export const PRESET_CONFIGS = {
  'Powerplay': ['Slip', 'Point', 'Cover', 'Extra Cover', 'Mid-off', 'Mid-on', 'Midwicket', 'Third Man', 'Long-on'],
  'Attacking': ['Slip', 'Second Slip', 'Third Slip', 'Gully', 'Point', 'Cover', 'Mid-off', 'Mid-on', 'Third Man'],
  'Defensive': ['Point', 'Cover', 'Midwicket', 'Square Leg', 'Third Man', 'Deep Cover', 'Long-off', 'Long-on', 'Deep Midwicket'],
  'Spin': ['Slip', 'Gully', 'Point', 'Cover', 'Mid-off', 'Mid-on', 'Midwicket', 'Deep Midwicket', 'Long-on'],
  'Death overs': ['Point', 'Cover', 'Mid-off', 'Mid-on', 'Third Man', 'Deep Cover', 'Long-off', 'Long-on', 'Deep Midwicket']
};

export const InteractiveField = ({
  positions = [],
  onChange,
  availableFielders = [],
  preset = 'Powerplay',
  onPresetChange,
  isPowerplay = false,
  format = 'T20',
  isReadOnly = false
}) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [draggedFielder, setDraggedFielder] = useState(null);

  // Extract currently occupied position names
  const occupiedMap = new Map();
  (positions || []).forEach(p => {
    occupiedMap.set(p.position, p);
  });

  // Calculate restrictions
  const currentPositions = (positions || []).map(p => p.position);
  let legCount = 0;
  let behindSquareCount = 0;
  let deepCount = 0;

  currentPositions.forEach(pos => {
    const meta = FIELD_POSITIONS_MAP[pos];
    if (meta) {
      if (meta.side === 'leg') {
        legCount++;
        if (meta.isBehindSquare) behindSquareCount++;
      }
      if (meta.isDeep) deepCount++;
    }
  });

  const totalFielders = currentPositions.length;
  const isExact9 = totalFielders === 9;
  const isLegValid = legCount <= 5;
  const isBehindSquareValid = behindSquareCount <= 2;
  const isDeepValid = isPowerplay ? deepCount <= 2 : deepCount <= 5;
  const isAllLegal = isExact9 && isLegValid && isBehindSquareValid && isDeepValid;

  const handleApplyPreset = (presetName) => {
    if (isReadOnly) return;
    const posList = PRESET_CONFIGS[presetName] || PRESET_CONFIGS['Powerplay'];
    const newPositions = posList.map((pos, idx) => ({
      position: pos,
      fielderId: availableFielders[idx]?.playerId || availableFielders[idx]?._id || `fld_${idx}`,
      fielderName: availableFielders[idx]?.name || availableFielders[idx]?.shortName || `Fielder ${idx + 1}`
    }));
    if (onPresetChange) onPresetChange(presetName);
    if (onChange) onChange(newPositions);
  };

  const handleTogglePosition = (posName) => {
    if (isReadOnly) return;

    if (occupiedMap.has(posName)) {
      // Remove fielder from this position
      const updated = positions.filter(p => p.position !== posName);
      if (onChange) onChange(updated);
      if (onPresetChange) onPresetChange('Custom');
    } else {
      // Add fielder to this position if less than 9
      if (positions.length >= 9) {
        alert('Field placement requires exactly 9 fielders. Remove a fielder before placing here, or drag to swap.');
        return;
      }
      // Pick next unused fielder
      const usedIds = new Set(positions.map(p => p.fielderId));
      const nextFielder = availableFielders.find(f => !usedIds.has(f.playerId || f._id)) || {
        playerId: `fld_${Date.now()}`,
        name: `Fielder ${positions.length + 1}`
      };

      const updated = [
        ...positions,
        {
          position: posName,
          fielderId: nextFielder.playerId || nextFielder._id,
          fielderName: nextFielder.name || nextFielder.shortName || 'Fielder'
        }
      ];
      if (onChange) onChange(updated);
      if (onPresetChange) onPresetChange('Custom');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, posName) => {
    if (isReadOnly) return;
    setDraggedFielder(posName);
    e.dataTransfer.setData('text/plain', posName);
  };

  const handleDrop = (e, targetPosName) => {
    e.preventDefault();
    if (isReadOnly || !draggedFielder || draggedFielder === targetPosName) return;

    const sourcePos = draggedFielder;
    const sourceOccupant = occupiedMap.get(sourcePos);
    const targetOccupant = occupiedMap.get(targetPosName);

    let updated = [...positions];

    if (targetOccupant) {
      // Swap the two positions
      updated = updated.map(p => {
        if (p.position === sourcePos) return { ...p, position: targetPosName };
        if (p.position === targetPosName) return { ...p, position: sourcePos };
        return p;
      });
    } else {
      // Move source to target empty position
      updated = updated.map(p => {
        if (p.position === sourcePos) return { ...p, position: targetPosName };
        return p;
      });
    }

    if (onChange) onChange(updated);
    if (onPresetChange) onPresetChange('Custom');
    setDraggedFielder(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Presets Navigation Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stadium-950 p-3.5 rounded-2xl border border-stadium-800">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold-400" />
          <span className="text-xs font-mono font-bold text-slate-300 uppercase">FIELD PRESETS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['Powerplay', 'Attacking', 'Defensive', 'Spin', 'Death overs'].map(pName => (
            <button
              key={pName}
              type="button"
              disabled={isReadOnly}
              onClick={() => handleApplyPreset(pName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                preset === pName
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'bg-stadium-900 text-slate-400 hover:text-white hover:bg-stadium-800 border border-white/5 disabled:opacity-50'
              }`}
            >
              {pName}
            </button>
          ))}
          {preset === 'Custom' && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-500/30">
              CUSTOM
            </span>
          )}
        </div>
      </div>

      {/* Official Fielding Restriction Status Indicator */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-all ${
        isAllLegal
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          : 'bg-red-950/40 border-red-500/50 text-red-200'
      }`}>
        <div className="flex items-center gap-2">
          {isAllLegal ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
          )}
          <span className="font-bold">
            {isAllLegal
              ? `LEGAL FIELD SETUP: 9 Fielders correctly deployed (${format})`
              : 'RESTRICTION VIOLATION: Adjust fielders to comply with ICC Laws'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-2 py-0.5 rounded font-bold ${isExact9 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
            Fielders: {totalFielders}/9
          </span>
          <span className={`px-2 py-0.5 rounded font-bold ${isDeepValid ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
            Deep: {deepCount}/{isPowerplay ? '2 (PP)' : '5'}
          </span>
          <span className={`px-2 py-0.5 rounded font-bold ${isLegValid ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
            Leg-side: {legCount}/5
          </span>
          <span className={`px-2 py-0.5 rounded font-bold ${isBehindSquareValid ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
            Behind Sq: {behindSquareCount}/2
          </span>
        </div>
      </div>

      {isReadOnly && (
        <div className="flex items-center gap-2 bg-blue-950/50 border border-blue-500/40 px-3.5 py-2 rounded-xl text-xs font-mono text-blue-300">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>SPECTATOR VIEW: Tactical field placement is in read-only observation mode.</span>
        </div>
      )}

      {/* Interactive Top-Down SVG Cricket Field */}
      <div className="relative w-full aspect-square max-w-[560px] mx-auto rounded-3xl overflow-hidden bg-stadium-950 border border-stadium-800 shadow-2xl p-2">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full select-none"
        >
          <defs>
            {/* Field grass gradient */}
            <radialGradient id="fieldGrass" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E3E2B" />
              <stop offset="65%" stopColor="#142C1E" />
              <stop offset="100%" stopColor="#0B1A12" />
            </radialGradient>

            {/* Pitch clay gradient */}
            <linearGradient id="pitchClay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B49767" />
              <stop offset="50%" stopColor="#C9AC7A" />
              <stop offset="100%" stopColor="#A88B5B" />
            </linearGradient>

            {/* Ring glow */}
            <filter id="glowCircle" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Boundary Oval */}
          <ellipse
            cx="300"
            cy="300"
            rx="280"
            ry="275"
            fill="url(#fieldGrass)"
            stroke="#22C55E"
            strokeWidth="3"
            strokeDasharray="8 4"
            className="opacity-90"
          />

          {/* Turf Mower Radial Patterns */}
          <ellipse cx="300" cy="300" rx="230" ry="225" fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.25" />
          <ellipse cx="300" cy="300" rx="190" ry="185" fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.25" />

          {/* 30-Yard Inner Circle Line */}
          <ellipse
            cx="300"
            cy="300"
            rx="145"
            ry="138"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeOpacity="0.75"
            filter="url(#glowCircle)"
          />
          <text x="300" y="152" fill="#E2E8F0" fontSize="9" fontFamily="monospace" textAnchor="middle" fillOpacity="0.8">
            30-YARD CIRCLE
          </text>

          {/* Pitch Strip (22 yards) */}
          <rect
            x="284"
            y="235"
            width="32"
            height="130"
            rx="4"
            fill="url(#pitchClay)"
            stroke="#78350F"
            strokeWidth="1.5"
          />

          {/* Crease lines */}
          {/* Bowling Crease (Top) */}
          <line x1="275" y1="250" x2="325" y2="250" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
          <circle cx="295" cy="247" r="1.5" fill="#DC2626" />
          <circle cx="300" cy="247" r="1.5" fill="#DC2626" />
          <circle cx="305" cy="247" r="1.5" fill="#DC2626" />

          {/* Batting Crease (Bottom) */}
          <line x1="275" y1="345" x2="325" y2="345" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
          <circle cx="295" cy="348" r="1.5" fill="#DC2626" />
          <circle cx="300" cy="348" r="1.5" fill="#DC2626" />
          <circle cx="305" cy="348" r="1.5" fill="#DC2626" />

          {/* Fixed Icons for Bowler, Striker, and Wicketkeeper */}
          {/* Bowler Node */}
          <g transform="translate(300, 235)">
            <circle cx="0" cy="0" r="9" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
            <text cx="0" y="3" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              BWL
            </text>
          </g>

          {/* Striker Node */}
          <g transform="translate(300, 335)">
            <circle cx="0" cy="0" r="9" fill="#F59E0B" stroke="#000000" strokeWidth="1.5" />
            <text cx="0" y="3" fill="#000000" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              BAT
            </text>
          </g>

          {/* Wicketkeeper Node */}
          <g transform="translate(300, 395)">
            <circle cx="0" cy="0" r="10" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
            <text cx="0" y="3" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              WK
            </text>
          </g>

          {/* Labels for Off-side and Leg-side */}
          <text x="75" y="45" fill="#94A3B8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            ← OFF SIDE
          </text>
          <text x="525" y="45" fill="#94A3B8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="end">
            LEG SIDE →
          </text>

          {/* 18 Official Fielding Position Nodes */}
          {Object.entries(FIELD_POSITIONS_MAP).map(([posName, meta]) => {
            const isOccupied = occupiedMap.has(posName);
            const occupant = occupiedMap.get(posName);
            const isHovered = selectedSlot === posName;

            return (
              <g
                key={posName}
                transform={`translate(${meta.x}, ${meta.y})`}
                className={`cursor-pointer transition-transform ${isReadOnly ? 'cursor-default' : 'hover:scale-110'}`}
                onClick={() => handleTogglePosition(posName)}
                draggable={!isReadOnly && isOccupied}
                onDragStart={(e) => handleDragStart(e, posName)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, posName)}
                onMouseEnter={() => setSelectedSlot(posName)}
                onMouseLeave={() => setSelectedSlot(null)}
              >
                {/* Outer halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={isOccupied ? 16 : 11}
                  fill={isOccupied ? (meta.isDeep ? '#8B5CF6' : '#EAB308') : '#1E293B'}
                  fillOpacity={isOccupied ? 0.9 : 0.4}
                  stroke={isOccupied ? '#FFFFFF' : '#64748B'}
                  strokeWidth={isOccupied ? 2 : 1}
                  strokeDasharray={isOccupied ? 'none' : '2 2'}
                />

                {/* Jersey / Number or Empty Dot */}
                {isOccupied ? (
                  <text
                    x="0"
                    y="4"
                    fill={meta.isDeep ? '#FFFFFF' : '#0B0F17'}
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {occupant?.fielderName ? occupant.fielderName.charAt(0).toUpperCase() : '★'}
                  </text>
                ) : (
                  <circle cx="0" cy="0" r="2.5" fill="#94A3B8" />
                )}

                {/* Position Title Badge */}
                <rect
                  x="-35"
                  y="18"
                  width="70"
                  height="14"
                  rx="4"
                  fill="#0B0F17"
                  fillOpacity="0.85"
                  stroke={isOccupied ? (meta.isDeep ? '#8B5CF6' : '#EAB308') : '#334155'}
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="28"
                  fill={isOccupied ? '#FFFFFF' : '#94A3B8'}
                  fontSize="7.5"
                  fontFamily="sans-serif"
                  fontWeight={isOccupied ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {posName}
                </text>

                {/* Tooltip on Hover */}
                {isHovered && (
                  <g transform="translate(0, -26)">
                    <rect
                      x="-55"
                      y="-16"
                      width="110"
                      height="20"
                      rx="6"
                      fill="#020617"
                      stroke="#EAB308"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="-2"
                      fill="#F8FAFC"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {isOccupied ? occupant?.fielderName || posName : `Click to place at ${posName}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Field Placement Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] font-mono text-slate-400 pt-2 border-t border-stadium-800">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gold-500 inline-block border border-white" />
          <span>Inner Ring Fielder ({ringCount})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500 inline-block border border-white" />
          <span>Deep Boundary Rider ({deepCount})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-white" />
          <span>Bowler (Fixed)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-white" />
          <span>Wicketkeeper (Fixed)</span>
        </span>
      </div>
    </div>
  );
};
