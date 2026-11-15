import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, History, TrendingUp, ShieldAlert, Award, Ban } from 'lucide-react';

export const AuctionReplayModal = ({
  isOpen,
  onClose,
  soldLots = [],
  unsoldLots = [],
  vetoedLots = [],
  spendingHistory = [],
  replayLogs = []
}) => {
  const [activeTab, setActiveTab] = useState('sold');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[85vh] bg-stadium-900 border border-gold-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-stadium-800 flex items-center justify-between bg-stadium-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-widest block">
                AUDIT LOG & REPLAY
              </span>
              <h2 className="font-display text-2xl font-black uppercase text-white">
                AUCTION REPLAY & SPENDING
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stadium-800 hover:bg-stadium-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-stadium-800 flex items-center gap-4 bg-stadium-950/20">
          {[
            { id: 'sold', label: `Sold Lots (${soldLots.length})`, icon: Award },
            { id: 'unsold', label: `Unsold Lots (${unsoldLots.length})`, icon: Ban },
            { id: 'vetoed', label: `T2 Vetoed (${vetoedLots.length})`, icon: ShieldAlert },
            { id: 'spending', label: 'Spending History', icon: TrendingUp },
            { id: 'logs', label: 'Raw Event Logs', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === 'sold' && (
            soldLots.length === 0 ? (
              <p className="text-center py-12 text-slate-500 font-mono text-xs">No lots sold yet.</p>
            ) : (
              soldLots.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-stadium-950 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 rounded-lg overflow-hidden border border-white/10 bg-stadium-900">
                      <img
                        src={item.lot?.playerImage}
                        alt={item.lot?.playerName}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <p className="font-display font-bold text-xs text-white">
                        {item.lot?.playerName} ({item.lot?.cardVariant || 'Peak'})
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Bought by: <span className="text-pitch-400 font-bold">{item.buyerUsername}</span> ({item.buyerTeam})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-black text-sm text-gold-400">
                      {item.finalPrice} points
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'unsold' && (
            unsoldLots.length === 0 ? (
              <p className="text-center py-12 text-slate-500 font-mono text-xs">No unsold lots.</p>
            ) : (
              unsoldLots.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-stadium-950 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 rounded-lg overflow-hidden border border-white/10 bg-stadium-900">
                      <img
                        src={item.lot?.playerImage}
                        alt={item.lot?.playerName}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <p className="font-display font-bold text-xs text-white">
                        {item.lot?.playerName}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {item.lot?.role} • OVR {typeof item.lot?.ovr === 'object' ? item.lot?.ovr.t20 : item.lot?.ovr}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase bg-stadium-850 px-2 py-0.5 rounded">
                      Unsold at 1 pt
                    </span>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'vetoed' && (
            vetoedLots.length === 0 ? (
              <p className="text-center py-12 text-slate-500 font-mono text-xs">No cricketers vetoed yet.</p>
            ) : (
              vetoedLots.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 rounded-lg overflow-hidden border border-red-500/30 bg-stadium-900">
                      <img
                        src={item.lot?.playerImage}
                        alt={item.lot?.playerName}
                        className="w-full h-full object-cover object-top opacity-70"
                      />
                    </div>
                    <div>
                      <p className="font-display font-bold text-xs text-white">
                        {item.lot?.playerName}
                      </p>
                      <p className="text-[10px] font-mono text-red-300">
                        T2 Veto played by: <strong>{item.vetoedByUsername}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase bg-red-500/10 px-2 py-1 rounded">
                      Permanently Barred
                    </span>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'spending' && (
            spendingHistory.length === 0 ? (
              <p className="text-center py-12 text-slate-500 font-mono text-xs">No transactions recorded.</p>
            ) : (
              spendingHistory.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-stadium-950 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-display font-bold text-white block">
                      {item.teamName} ({item.playerName})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-display font-black text-gold-400 text-sm">
                    {item.amount} pts
                  </span>
                </div>
              ))
            )
          )}

          {activeTab === 'logs' && (
            replayLogs.length === 0 ? (
              <p className="text-center py-12 text-slate-500 font-mono text-xs">No logs recorded.</p>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px]">
                {replayLogs.map((log, i) => (
                  <div key={i} className="p-2 rounded bg-stadium-950 border border-white/5 text-slate-400 flex items-center justify-between">
                    <div>
                      <span className="text-gold-400 font-bold mr-2">[{log.event}]</span>
                      <span>{JSON.stringify(log.data || {})}</span>
                    </div>
                    <span className="text-[9px] text-slate-600">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};

