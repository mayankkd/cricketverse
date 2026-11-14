import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Coins,
  Shield,
  Zap,
  Activity,
  Users,
  Flame,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Radio,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FutCard } from '../components/common/FutCard';
import { sound } from '../services/sound';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [activeMatches, setActiveMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [playersRes, matchesRes, tournamentsRes] = await Promise.all([
          api.getPlayers(),
          api.getMatches(),
          api.getTournaments()
        ]);

        if (playersRes.success) setPlayers(playersRes.players || []);
        if (matchesRes.success) setActiveMatches(matchesRes.matches || []);
        if (tournamentsRes.success) setTournaments(tournamentsRes.tournaments || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatPurse = (val) => {
    if (!val) return '₹100 Cr';
    return `₹${(val / 10000000).toFixed(1)} Cr`;
  };

  // Recharts Data
  const pieData = [
    { name: 'Wins', value: user?.stats?.matchesWon || 34, color: '#10B981' },
    { name: 'Losses', value: user?.stats?.matchesLost || 14, color: '#EF4444' },
    { name: 'Ties', value: 2, color: '#F59E0B' }
  ];

  const ratingHistory = [
    { match: 'M1', rating: 1200 },
    { match: 'M10', rating: 1350 },
    { match: 'M20', rating: 1520 },
    { match: 'M30', rating: 1680 },
    { match: 'M40', rating: 1750 },
    { match: 'Recent', rating: user?.rating || 1845 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Manager Passport Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stadium-900 via-stadium-850 to-amber-950/40 border border-gold-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-gold-gradient opacity-5 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                alt={user?.username}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-400 shadow-gold-glow"
              />
              <span className="absolute -bottom-2 -right-2 bg-gold-500 text-slate-950 font-display font-black text-xs px-2 py-0.5 rounded-full uppercase">
                LVL {user?.level || 14}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-pitch-400 tracking-wider">
                  OFFICIAL FRANCHISE PASSPORT
                </span>
                <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {user?.tier || 'Legend'} Tier
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-wide mt-0.5">
                {user?.username}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <span>{user?.favoriteTeam}</span> • <span>Rating: <strong className="text-gold-400">{user?.rating || 1845} ELO</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stadium-950/80 border border-white/5 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Auction Purse</span>
              <span className="font-display font-black text-xl text-gold-400">{formatPurse(user?.budget)}</span>
            </div>
            <div className="bg-stadium-950/80 border border-white/5 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Win Ratio</span>
              <span className="font-display font-black text-xl text-pitch-400">{user?.stats?.winRate || 70.8}%</span>
            </div>
            <div className="bg-stadium-950/80 border border-white/5 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Matches</span>
              <span className="font-display font-black text-xl text-white">{user?.stats?.matchesPlayed || 48}</span>
            </div>
            <div className="bg-stadium-950/80 border border-white/5 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Trophies</span>
              <span className="font-display font-black text-xl text-amber-400">{user?.stats?.tournamentsWon || 3} 🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Create Room', path: '/rooms/create', icon: PlusCircle, color: 'text-pitch-400', bg: 'hover:border-pitch-500/50' },
          { label: 'Join Room', path: '/rooms/join', icon: Users, color: 'text-electric-400', bg: 'hover:border-electric-500/50' },
          { label: 'Live Auction', path: '/auction', icon: Flame, color: 'text-gold-400', bg: 'hover:border-gold-500/50' },
          { label: 'Match Center', path: '/matches', icon: Activity, color: 'text-red-400', bg: 'hover:border-red-500/50' },
          { label: 'Squad XI', path: '/teams', icon: Trophy, color: 'text-amber-400', bg: 'hover:border-amber-500/50' },
          { label: 'Cards Market', path: '/players', icon: Shield, color: 'text-indigo-400', bg: 'hover:border-indigo-500/50' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={i}
              to={item.path}
              onClick={() => sound.playClick()}
              className={`bg-stadium-900 border border-stadium-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center group transition-all ${item.bg}`}
            >
              <div className={`p-2.5 rounded-xl bg-stadium-950 border border-white/5 ${item.color} mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xs uppercase text-slate-200 group-hover:text-white">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Analytics & Performance Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Win/Loss Pie Chart */}
        <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-white">Match Outcome Index</h3>
              <p className="text-[11px] font-mono text-slate-400">CAREER WIN / LOSS DISTRIBUTION</p>
            </div>
            <Award className="w-5 h-5 text-pitch-400" />
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around border-t border-stadium-800 pt-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-pitch-400 font-bold">● {user?.stats?.matchesWon || 34} W</span>
            <span className="flex items-center gap-1.5 text-red-400 font-bold">● {user?.stats?.matchesLost || 14} L</span>
            <span className="flex items-center gap-1.5 text-gold-400 font-bold">● 2 Tied</span>
          </div>
        </div>

        {/* ELO Rating Progression Chart */}
        <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-white">Rating Curve (ELO)</h3>
              <p className="text-[11px] font-mono text-slate-400">CHAMPIONSHIP ARENA PROGRESSION</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gold-400" />
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ratingHistory}>
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="match" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis domain={[1000, 2000]} stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#F59E0B', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="rating" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#ratingGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between border-t border-stadium-800 pt-3 text-xs text-slate-400 font-mono">
            <span>PEAK RATING: 1892</span>
            <span className="text-gold-400 font-bold">CURRENT: {user?.rating || 1845} (GLOBAL RANK #14)</span>
          </div>
        </div>
      </div>

      {/* Live Match Alert & Active Rooms Bar */}
      <div className="bg-gradient-to-r from-red-950/60 via-stadium-900 to-stadium-900 border border-red-500/40 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0 animate-pulse">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                ARENA IN PROGRESS
              </span>
              <span className="text-xs font-mono text-slate-400">Eden Gardens, Night Final</span>
            </div>
            <h4 className="font-display text-xl font-bold uppercase text-white mt-0.5">
              Bangalore Royal Titans (184/4) vs Mumbai Kings XI (178/6)
            </h4>
            <p className="text-xs text-gold-400 font-medium">
              Death overs live: Virat Kohli 74* (42) on strike • Bumrah bowling
            </p>
          </div>
        </div>

        <Link
          to="/matches"
          onClick={() => sound.playClick()}
          className="bg-red-600 hover:bg-red-500 text-white font-display uppercase font-bold text-xs px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 flex-shrink-0"
        >
          SPECTATE LIVE CENTER <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Featured Squad Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold uppercase text-white">Top Franchise Signings</h3>
            <p className="text-xs font-mono text-slate-400">ACTIVE PLAYING XI HEADLINERS</p>
          </div>
          <Link
            to="/players"
            onClick={() => sound.playClick()}
            className="text-xs font-display uppercase font-bold text-gold-400 hover:underline flex items-center gap-1"
          >
            EXPLORE ALL CARDS <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {players.slice(0, 4).map((player) => (
            <FutCard
              key={player._id}
              player={player}
              onClick={() => navigate('/players')}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

