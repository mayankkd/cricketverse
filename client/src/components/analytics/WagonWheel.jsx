import React, { useState, useMemo } from 'react';
import { Target, Filter } from 'lucide-react';

export default function WagonWheel({ deliveries = [], boundaryMeters = 70 }) {
  const [selectedBatter, setSelectedBatter] = useState('ALL');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, BOUNDARIES, SIXES, FOURS, ONES_TWOS, WICKETS
  const [hoveredDelivery, setHoveredDelivery] = useState(null);

  // Extract unique batters
  const batters = useMemo(() => {
    const set = new Set();
    deliveries.forEach(d => {
      if (d.striker?.name) set.add(d.striker.name);
    });
    return Array.from(set);
  }, [deliveries]);

  // Filter deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      if (selectedBatter !== 'ALL' && d.striker?.name !== selectedBatter) {
        return false;
      }
      if (selectedFilter === 'BOUNDARIES' && d.runs < 4) return false;
      if (selectedFilter === 'SIXES' && d.runs !== 6) return false;
      if (selectedFilter === 'FOURS' && d.runs !== 4) return false;
      if (selectedFilter === 'ONES_TWOS' && (d.runs !== 1 && d.runs !== 2)) return false;
      if (selectedFilter === 'WICKETS' && !d.isWicket) return false;
      return true;
    });
  }, [deliveries, selectedBatter, selectedFilter]);

  // Center of SVG coordinate space (200, 200), radius 160
  const CX = 200;
  const CY = 200;
  const R_BOUNDARY = 150;
  const R_CIRCLE = 85;

  const getShotColor = (d) => {
    if (d.isWicket) return '#EF4444'; // Red
    if (d.runs === 6) return '#A855F7'; // Purple
    if (d.runs === 4) return '#10B981'; // Green
    if (d.runs === 2) return '#3B82F6'; // Blue
    if (d.runs === 1) return '#F59E0B'; // Amber
    return '#6B7280'; // Grey
  };

  // Convert polar coordinates to Cartesian
  const calculateEndCoord = (angleDeg, distanceMeters) => {
    // 0 deg = Long-off (straight up / slightly right in cricket top-down)
    // -90 deg from standard math to make 0 deg point straight up (12 o'clock)
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const scaledR = (distanceMeters / (boundaryMeters + 12)) * R_BOUNDARY;
    const clampedR = Math.min(R_BOUNDARY + 6, Math.max(12, scaledR));
    return {
      x: CX + clampedR * Math.cos(rad),
      y: CY + clampedR * Math.sin(rad)
    };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Wagon Wheel
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                360° Field
              </span>
            </h3>
            <p className="text-xs text-slate-400">Shot distribution and scoring zones</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {batters.length > 0 && (
            <select
              value={selectedBatter}
              onChange={(e) => setSelectedBatter(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Batters</option>
              {batters.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            {['ALL', 'SIXES', 'FOURS', 'ONES_TWOS', 'WICKETS'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedFilter === f
                    ? 'bg-emerald-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'SIXES' ? '6s' : f === 'FOURS' ? '4s' : f === 'ONES_TWOS' ? '1s & 2s' : 'Wkts'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Radial Field Visualizer */}
      <div className="relative flex justify-center items-center py-2">
        <svg viewBox="0 0 400 400" className="w-full max-w-[380px] h-auto select-none">
          {/* Outfield Grass Circle */}
          <circle cx={CX} cy={CY} r={R_BOUNDARY} fill="#064E3B" fillOpacity="0.4" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
          
          {/* 30-Yard Inner Circle */}
          <circle cx={CX} cy={CY} r={R_CIRCLE} fill="#064E3B" fillOpacity="0.25" stroke="#34D399" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Field Sectors Reference Guides */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
            const rad = ((deg - 90) * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={CX}
                y1={CY}
                x2={CX + R_BOUNDARY * Math.cos(rad)}
                y2={CY + R_BOUNDARY * Math.sin(rad)}
                stroke="#10B981"
                strokeOpacity="0.15"
                strokeWidth="1"
              />
            );
          })}

          {/* Field Sector Sector Labels */}
          <text x={CX} y={CY - R_BOUNDARY - 8} fill="#94A3B8" fontSize="9" textAnchor="middle" fontWeight="bold">LONG OFF / ON</text>
          <text x={CX + R_BOUNDARY + 16} y={CY + 3} fill="#94A3B8" fontSize="9" textAnchor="middle" fontWeight="bold">LEG SIDE</text>
          <text x={CX} y={CY + R_BOUNDARY + 16} fill="#94A3B8" fontSize="9" textAnchor="middle" fontWeight="bold">FINE LEG / THIRD MAN</text>
          <text x={CX - R_BOUNDARY - 14} y={CY + 3} fill="#94A3B8" fontSize="9" textAnchor="middle" fontWeight="bold">OFF SIDE</text>

          {/* Central Pitch Strip */}
          <rect x={CX - 5} y={CY - 16} width="10" height="32" rx="2" fill="#D97706" fillOpacity="0.85" stroke="#B45309" strokeWidth="1" />
          <line x1={CX - 4} y1={CY - 11} x2={CX + 4} y2={CY - 11} stroke="#FFF" strokeWidth="1" />
          <line x1={CX - 4} y1={CY + 11} x2={CX + 4} y2={CY + 11} stroke="#FFF" strokeWidth="1" />

          {/* Shot Ray Lines */}
          {filteredDeliveries.map((d, idx) => {
            const angle = d.wagonWheel?.angleDeg ?? 295;
            const dist = d.wagonWheel?.distanceMeters ?? 50;
            const end = calculateEndCoord(angle, dist);
            const color = getShotColor(d);
            const isHovered = hoveredDelivery === d;

            return (
              <g
                key={idx}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredDelivery(d)}
                onMouseLeave={() => setHoveredDelivery(null)}
              >
                <line
                  x1={CX}
                  y1={CY}
                  x2={end.x}
                  y2={end.y}
                  stroke={color}
                  strokeWidth={isHovered ? 3.5 : d.runs >= 4 ? 2.2 : 1.5}
                  strokeOpacity={isHovered ? 1.0 : 0.85}
                  strokeLinecap="round"
                />
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={isHovered ? 5 : d.runs === 6 ? 4 : 3}
                  fill={color}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredDelivery && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-700 px-3.5 py-2 rounded-xl shadow-xl text-xs backdrop-blur-md pointer-events-none z-20 min-w-[200px] text-center">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
              <span className="font-bold text-white">{hoveredDelivery.striker?.name || 'Striker'}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                hoveredDelivery.runs === 6 ? 'bg-purple-500/20 text-purple-300' :
                hoveredDelivery.runs === 4 ? 'bg-emerald-500/20 text-emerald-300' :
                hoveredDelivery.isWicket ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {hoveredDelivery.badge || `${hoveredDelivery.runs} Runs`}
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="text-slate-400">Direction: </span>{hoveredDelivery.direction || 'Cover'} ({hoveredDelivery.wagonWheel?.distanceMeters || 65}m)
            </div>
            <div className="text-[11px] text-slate-400">
              vs {hoveredDelivery.bowler?.name || 'Bowler'} • {hoveredDelivery.shotType || 'Drive'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span className="text-slate-300 font-medium">6 Runs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 font-medium">4 Runs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span className="text-slate-300 font-medium">2 Runs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-300 font-medium">1 Run</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-slate-300 font-medium">Wicket</span>
        </div>
      </div>
    </div>
  );
}

