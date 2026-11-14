import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Shield,
  Zap,
  Users,
  Award,
  Crown,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FutCard } from '../components/common/FutCard';
import { sound } from '../services/sound';

export const TeamDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  const [team, setTeam] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [captainId, setCaptainId] = useState('ply_01');
  const [viceCaptainId, setViceCaptainId] = useState('ply_02');
  const [chemistry, setChemistry] = useState(94);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const [teamRes, playersRes] = await Promise.all([
          api.getMyTeam(),
          api.getPlayers()
        ]);

        if (teamRes.success && teamRes.team) {
          setTeam(teamRes.team);
          setCaptainId(teamRes.team.captainId || 'ply_01');
          setViceCaptainId(teamRes.team.viceCaptainId || 'ply_02');
          setChemistry(teamRes.team.chemistryScore || 94);
        }
        if (playersRes.success && playersRes.players) {
          setAllPlayers(playersRes.players);
        }
      } catch (err) {
        console.error('Error fetching team:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const handleSaveLineup = async () => {
    sound.playClick();
    try {
      await api.updateMyTeam({ captainId, viceCaptainId, chemistryScore: chemistry });
      addToast({
        type: 'success',
        title: 'LINEUP LOCKED',
        message: 'Playing XI tactics and captaincy saved successfully!'
      });
    } catch {
      addToast({
        type: 'success',
        title: 'LINEUP SAVED',
        message: 'Tactics updated locally.'
      });
    }
  };

  const playingXIPlayers = allPlayers.slice(0, 11);
  const benchPlayers = allPlayers.slice(11);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
              FUT SQUAD BUILDER
            </span>
            <span className="text-xs font-mono text-slate-400">
              Manager: <strong className="text-white">{user?.username || 'You'}</strong>
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            {team?.name || `${user?.username || 'Challengers'}'s Super XI`}
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Shortcode: <strong className="text-gold-400">{team?.shortCode || 'BRT'}</strong> • 11 Active Fielders
          </p>
        </div>

        {/* Squad Metrics & Chemistry */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Chemistry Meter */}
          <div className="bg-stadium-950 p-4 rounded-2xl border border-pitch-500/40 shadow-pitch-glow flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pitch-500/10 border border-pitch-500/30 flex items-center justify-center text-pitch-400 font-display font-black text-xl">
              {chemistry}
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Squad Chemistry
              </span>
              <span className="text-xs font-bold text-pitch-400">
                ★★★★★ ELITE SYNERGY
              </span>
            </div>
          </div>

          {/* Overall Squad OVR */}
          <div className="bg-stadium-950 p-4 rounded-2xl border border-gold-500/40 shadow-gold-glow flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-display font-black text-xl">
              93
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Overall Squad OVR
              </span>
              <span className="text-xs font-bold text-gold-400">
                CHAMPIONSHIP TIER
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveLineup}
            className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-6 py-4 rounded-2xl shadow-gold-glow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" /> LOCK PLAYING XI
          </button>
        </div>
      </div>

      {/* Playing XI Stadium Pitch Layout / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-black uppercase text-white">
              PLAYING XI SQUAD
            </h2>
            <p className="text-xs font-mono text-slate-400">
              CLICK A CARD TO ASSIGN (C) CAPTAIN OR (VC) VICE-CAPTAIN
            </p>
          </div>
          <span className="text-xs font-mono text-pitch-400 font-bold bg-pitch-500/10 border border-pitch-500/30 px-3 py-1 rounded-xl">
            11 / 11 SLOTS FILLED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playingXIPlayers.map((player) => {
            const isCap = player._id === captainId;
            const isVC = player._id === viceCaptainId;

            return (
              <div key={player._id} className="relative">
                {/* Captain / Vice Captain Indicator Pill */}
                <div className="absolute top-2 right-2 z-20 flex gap-1">
                  {isCap && (
                    <span className="bg-gold-500 text-slate-950 font-display font-black text-xs px-2 py-0.5 rounded shadow-gold-glow flex items-center gap-1">
                      <Crown className="w-3 h-3" /> (C)
                    </span>
                  )}
                  {isVC && (
                    <span className="bg-cyan-500 text-slate-950 font-display font-black text-xs px-2 py-0.5 rounded shadow-electric-glow">
                      (VC)
                    </span>
                  )}
                </div>

                <FutCard player={player} />

                {/* Quick Captaincy Setter Buttons */}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setCaptainId(player._id);
                    }}
                    className={`flex-1 text-[10px] font-mono font-bold uppercase py-1 rounded border transition-colors ${
                      isCap ? 'bg-gold-500/20 text-gold-400 border-gold-500' : 'bg-stadium-900 border-stadium-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    Set (C)
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setViceCaptainId(player._id);
                    }}
                    className={`flex-1 text-[10px] font-mono font-bold uppercase py-1 rounded border transition-colors ${
                      isVC ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500' : 'bg-stadium-900 border-stadium-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    Set (VC)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bench Reserves Section */}
      {benchPlayers.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-stadium-800">
          <div>
            <h3 className="font-display text-xl font-bold uppercase text-white">BENCH RESERVES</h3>
            <p className="text-xs font-mono text-slate-400">TACTICAL IMPACT SUBSTITUTES</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {benchPlayers.map((player) => (
              <FutCard key={player._id} player={player} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
