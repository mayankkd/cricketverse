import React, { useState, useMemo } from 'react';
import { Crosshair, Filter } from 'lucide-react';

export default function PitchMap({ deliveries = [], pitchType = 'Turning' }) {
  const [selectedBowler, setSelectedBowler] = useState('ALL');
  const [selectedLength, setSelectedLength] = useState('ALL');
  const [hoveredDelivery, setHoveredDelivery] = useState(null);

  // Extract unique bowlers
  const bowlers = useMemo(() => {
    const set = new Set();
    deliveries.forEach(d => {
      if (d.bowler?.name) set.add(d.bowler.name);
    });
    return Array.from(set);
  }, [deliveries]);

  // Filter deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      if (selectedBowler !== 'ALL' && d.bowler?.name !== selectedBowler) return false;
      if (selectedLength !== 'ALL' && d.pitchLength !== selectedLength) return false;
      return true;
    });
  }, [deliveries, selectedBowler, selectedLength]);

  // Pitch strip dimension constants (width: 220, height: 360)
  const PW = 220;
  const PH = 360;

  // Coordinate mapping:
  // x: -0.6 (Outside Off) to +0.35 (Leg Side) -> maps to 20px to 200px
  // y: 0.25 (Short) to 0.95 (Yorker) -> maps to 50px to 330px
  const mapCoords = (normX = 0, normY = 0.6) => {
    const cx = PW / 2; // Middle stump center
    const pixelX = cx + (normX * 180);
    const pixelY = normY * PH;
    return {
      x: Math.max(15, Math.min(PW - 15, pixelX)),
      y: Math.max(20, Math.min(PH - 20, pixelY))
    };
  };

  const getMarkerColor = (d) => {
    if (d.isWicket) return '#EF4444'; // Red
    if (d.runs === 6) return '#A855F7'; // Purple
    if (d.runs === 4) return '#10B981'; // Green
    if (d.runs === 0) return '#64748B'; // Grey (Dot)
    return '#F59E0B'; // Amber
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Pitch Map
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                {pitchType} Surface
              </span>
            </h3>
            <p className="text-xs text-slate-400">Delivery line & length impact coordinates</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {bowlers.length > 0 && (
            <select
              value={selectedBowler}
              onChange={(e) => setSelectedBowler(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Bowlers</option>
              {bowlers.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          <select
            value={selectedLength}
            onChange={(e) => setSelectedLength(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Lengths</option>
            <option value="Yorker">Yorker</option>
            <option value="Full">Full</option>
            <option value="Good Length">Good Length</option>
            <option value="Short">Short</option>
          </select>
        </div>
      </div>

      {/* 2D Pitch Graphic */}
      <div className="relative flex justify-center items-center py-2">
        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full max-w-[240px] h-auto select-none rounded-xl overflow-hidden shadow-inner">
          {/* Pitch Turf Background */}
          <rect
            x="0"
            y="0"
            width={PW}
            height={PH}
            fill={
              pitchType === 'Green' ? '#064E3B' :
              pitchType === 'Cracked' ? '#78350F' :
              pitchType === 'Turning' ? '#92400E' : '#B45309'
            }
            fillOpacity="0.45"
            stroke="#D97706"
            strokeWidth="1.5"
          />

          {/* Length Zones Bands */}
          {/* Short Length Zone (Top) */}
          <rect x="0" y="30" width={PW} height="90" fill="#3B82F6" fillOpacity="0.08" />
          <line x1="0" y1="120" x2={PW} y2="120" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
          <text x="12" y="75" fill="#94A3B8" fontSize="9" fontWeight="bold">SHORT</text>

          {/* Good Length Zone (Middle) */}
          <rect x="0" y="120" width={PW} height="95" fill="#10B981" fillOpacity="0.08" />
          <line x1="0" y1="215" x2={PW} y2="215" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
          <text x="12" y="170" fill="#94A3B8" fontSize="9" fontWeight="bold">GOOD LENGTH</text>

          {/* Full Length Zone */}
          <rect x="0" y="215" width={PW} height="75" fill="#F59E0B" fillOpacity="0.08" />
          <line x1="0" y1="290" x2={PW} y2="290" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
          <text x="12" y="255" fill="#94A3B8" fontSize="9" fontWeight="bold">FULL</text>

          {/* Yorker Zone (Near Popping Crease) */}
          <rect x="0" y="290" width={PW} height="40" fill="#EF4444" fillOpacity="0.08" />
          <text x="12" y="315" fill="#94A3B8" fontSize="9" fontWeight="bold">YORKER</text>

          {/* Popping Crease Line & Bowling Stumps (Bottom) */}
          <line x1="25" y1="330" x2={PW - 25} y2="330" stroke="#FFFFFF" strokeWidth="2" />
          {/* Stumps */}
          <circle cx={PW / 2 - 8} cy="336" r="2.5" fill="#FDE047" />
          <circle cx={PW / 2} cy="336" r="2.5" fill="#FDE047" />
          <circle cx={PW / 2 + 8} cy="336" r="2.5" fill="#FDE047" />
          <line x1={PW / 2 - 11} y1="336" x2={PW / 2 + 11} y2="336" stroke="#FDE047" strokeWidth="1.5" />

          {/* Lateral Stump Lines Guides */}
          <line x1={PW / 2} y1="30" x2={PW / 2} y2="330" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2 4" strokeOpacity="0.4" />

          {/* Ball Landing Marks */}
          {filteredDeliveries.map((d, idx) => {
            const coords = mapCoords(d.pitchMap?.x || 0, d.pitchMap?.y || 0.6);
            const color = getMarkerColor(d);
            const isHovered = hoveredDelivery === d;

            return (
              <g
                key={idx}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredDelivery(d)}
                onMouseLeave={() => setHoveredDelivery(null)}
              >
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isHovered ? 6 : d.isWicket ? 5 : 4}
                  fill={color}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                  className={isHovered ? 'animate-pulse' : ''}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredDelivery && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-700 px-3.5 py-2 rounded-xl shadow-xl text-xs backdrop-blur-md pointer-events-none z-20 min-w-[190px] text-center">
            <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1">
              {hoveredDelivery.bowler?.name || 'Bowler'}
            </div>
            <div className="text-[11px] text-amber-300 font-semibold">
              {hoveredDelivery.pitchLength || 'Good Length'} • {hoveredDelivery.pitchLine || 'Off Stump'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Result: <span className="text-white font-medium">{hoveredDelivery.badge || `${hoveredDelivery.runs} runs`}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-slate-300">Wicket</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300">Four</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span className="text-slate-300">Six</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
          <span className="text-slate-300">Dot Ball</span>
        </div>
      </div>
    </div>
  );
}
