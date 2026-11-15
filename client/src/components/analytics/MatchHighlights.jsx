import React, { useState, useMemo } from 'react';
import { Film, PlayCircle, Filter } from 'lucide-react';
import DeliveryReplayModal from './DeliveryReplayModal';

export default function MatchHighlights({ highlights = [] }) {
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, WICKETS, SIXES, FOURS
  const [selectedHighlight, setSelectedHighlight] = useState(null);

  const fallbackHighlights = [
    {
      id: 'hl_1',
      over: '0.1',
      type: 'FOUR',
      title: 'Virat Kohli punches through cover for FOUR',
      runs: 4,
      striker: 'Virat Kohli',
      bowler: 'Jasprit Bumrah',
      badge: 'FOUR',
      commentary: {
        professional: 'GLORIOUS SHOT! Timed to perfection, bulleting through the fielders for FOUR!',
        hype: 'BOOM! CRACKING COVER DRIVE! RACING AWAY TO THE FENCE!',
        savage: 'The fielder had the best seat in the stadium watching that cruise to the rope.'
      },
      deliveryData: { shotType: 'Drive', direction: 'Cover' }
    },
    {
      id: 'hl_2',
      over: '1.3',
      type: 'SIX',
      title: 'Glenn Maxwell hooks into the second tier for SIX',
      runs: 6,
      striker: 'Glenn Maxwell',
      bowler: 'Mohammed Siraj',
      badge: 'SIX',
      commentary: {
        professional: 'MAXIMUM! Maxwell connected with pristine perfection! The ball sails 102 meters into the stands for SIX!',
        hype: 'OUTTA HERE! SENT INTO ORBIT! 102 METERS OF PURE CARNAGE!',
        savage: 'Someone call air traffic control because that ball has entered commercial airspace.'
      },
      deliveryData: { shotType: 'Pull / Hook', direction: 'Midwicket' }
    },
    {
      id: 'hl_3',
      over: '2.4',
      type: 'WICKET',
      title: 'Jasprit Bumrah cleans up Glenn Maxwell with an unplayable Yorker',
      runs: 0,
      striker: 'Glenn Maxwell',
      bowler: 'Jasprit Bumrah',
      badge: 'WICKET',
      commentary: {
        professional: 'TIMBER! What an unplayable delivery from Bumrah! Perfect seam presentation, nipping back sharply off the pitch to shatter the stumps.',
        hype: 'TIMBERRRRRRR! THE FURNITURE IS RATTLED! WHAT A RIPPER BY BUMRAH!',
        savage: 'There was so much daylight between Maxwell’s bat and pad you could have built a shopping mall in between.'
      },
      deliveryData: { shotType: 'Drive', direction: 'Mid-off' }
    }
  ];

  const displayList = highlights && highlights.length > 0 ? highlights : fallbackHighlights;

  const filteredList = useMemo(() => {
    return displayList.filter(h => {
      if (activeFilter === 'WICKETS' && h.badge !== 'WICKET') return false;
      if (activeFilter === 'SIXES' && h.badge !== 'SIX') return false;
      if (activeFilter === 'FOURS' && h.badge !== 'FOUR') return false;
      return true;
    });
  }, [displayList, activeFilter]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
              Match Highlights & Replays
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                Key Moments
              </span>
            </h3>
            <p className="text-xs text-slate-400">Instant replay of boundaries, maximums and decisive wickets</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
          {['ALL', 'WICKETS', 'SIXES', 'FOURS'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === f
                  ? 'bg-rose-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? 'All Moments' : f === 'WICKETS' ? 'Wickets' : f === 'SIXES' ? 'Sixes' : 'Fours'}
            </button>
          ))}
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          No highlights matching the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredList.map((h, idx) => (
            <div
              key={h.id || idx}
              onClick={() => setSelectedHighlight(h)}
              className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/40 p-3.5 rounded-xl cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  h.badge === 'SIX' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  h.badge === 'FOUR' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {h.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Over {h.over}
                </span>
              </div>

              <h4 className="text-xs font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-2 mb-2">
                {h.title}
              </h4>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/40">
                <span className="truncate max-w-[140px]">{h.striker}</span>
                <span className="flex items-center gap-1 text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <PlayCircle className="w-3.5 h-3.5" /> Replay
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Replay Modal */}
      <DeliveryReplayModal
        isOpen={!!selectedHighlight}
        onClose={() => setSelectedHighlight(null)}
        highlight={selectedHighlight}
      />
    </div>
  );
}

