import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Search, Lock, Globe, ArrowRight, PlusCircle, Flame, Activity } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { sound } from '../services/sound';

export const JoinRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.getRooms();
        if (res.success && res.rooms) {
          setRooms(res.rooms);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    sound.playClick();
    const code = roomCodeInput.trim().toUpperCase();

    try {
      const res = await api.joinRoom(code, { teamName: user ? `${user.username}'s XI` : 'Challengers XI' });
      if (res.success) {
        addToast({
          type: 'success',
          title: 'ACCESS GRANTED',
          message: `Entering room ${code}`
        });
        navigate(`/rooms/${code}`);
      } else {
        addToast({
          type: 'error',
          title: 'ROOM NOT FOUND',
          message: res.message || 'Could not join room'
        });
      }
    } catch {
      navigate(`/rooms/${code}`);
    }
  };

  const handle1ClickJoin = async (room) => {
    sound.playClick();
    try {
      const res = await api.joinRoom(room.roomCode, { teamName: user ? `${user.username}'s XI` : 'Challengers XI' });
      navigate(`/rooms/${room.roomCode}`);
    } catch {
      navigate(`/rooms/${room.roomCode}`);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchFilter.toLowerCase()) || r.roomCode.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFormat = selectedFormat === 'All' || r.format === selectedFormat;
    return matchesSearch && matchesFormat;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black uppercase text-white tracking-wide">
            MULTIPLAYER ROOM LOBBIES
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            ENTER VIA PASSCODE OR JOIN AN OPEN ARENA DUGOUT
          </p>
        </div>

        <Link
          to="/rooms/create"
          onClick={() => sound.playClick()}
          className="bg-pitch-600 hover:bg-pitch-500 text-white font-display uppercase font-bold text-xs px-5 py-3 rounded-xl shadow-pitch-glow flex items-center gap-2 self-start md:self-auto transition-transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" /> CREATE NEW ROOM
        </Link>
      </div>

      {/* Direct Code Join Card */}
      <div className="bg-gradient-to-r from-stadium-900 via-stadium-850 to-gold-950/30 border border-gold-500/40 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-wider block">
            PRIVATE OR TOURNAMENT ACCESS
          </span>
          <h3 className="font-display text-xl font-bold uppercase text-white mt-0.5">
            JOIN VIA UNIQUE ROOM CODE
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Have a room pass from your league host? Enter it below.
          </p>
        </div>

        <form onSubmit={handleJoinByCode} className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            required
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            placeholder="e.g. IPL-2026"
            className="bg-stadium-950 border border-gold-500/50 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase tracking-widest placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-gold-500 w-full md:w-48 text-center font-bold"
          />
          <button
            type="submit"
            className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-6 py-3.5 rounded-xl shadow-gold-glow flex-shrink-0 transition-transform active:scale-95"
          >
            ENTER ARENA
          </button>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search room title or code..."
            className="w-full bg-stadium-900 border border-stadium-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-stadium-700"
          />
        </div>

        {/* Format Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stadium-900 p-1 rounded-xl border border-stadium-800 self-stretch sm:self-auto overflow-x-auto">
          {['All', 'T20', 'The Hundred', 'Super Over'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => {
                sound.playClick();
                setSelectedFormat(fmt);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-display uppercase font-bold transition-colors ${
                selectedFormat === fmt
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Public Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => {
          const filledSlots = room.participants?.length || 1;
          const maxSlots = room.maxTeams || 8;
          const isFull = filledSlots >= maxSlots;

          return (
            <motion.div
              key={room.roomCode}
              whileHover={{ y: -4 }}
              className="bg-stadium-900 border border-stadium-800 hover:border-gold-500/50 p-6 rounded-3xl transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-gold-400 bg-gold-500/10 border border-gold-500/30 px-2.5 py-1 rounded-lg">
                    {room.roomCode}
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    room.status === 'auction' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/40'
                  }`}>
                    {room.status === 'auction' ? '● AUCTION LIVE' : 'WAITING FOR MANAGERS'}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold uppercase text-white truncate">
                  {room.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Host: <strong className="text-slate-300">{room.hostUsername}</strong> • Format: {room.format}
                </p>

                {/* Progress bar of slots */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>MANAGER CAPACITY</span>
                    <span className="font-bold text-white">{filledSlots} / {maxSlots} Filled</span>
                  </div>
                  <div className="w-full bg-stadium-950 h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-red-500' : 'bg-gradient-to-r from-pitch-500 to-gold-400'
                      }`}
                      style={{ width: `${(filledSlots / maxSlots) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-stadium-950 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Purse: ₹{(room.budgetPerTeam / 10000000).toFixed(0)} Cr</span>
                  <span className="text-slate-400">{room.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stadium-800">
                <button
                  onClick={() => handle1ClickJoin(room)}
                  disabled={isFull}
                  className={`w-full font-display uppercase font-bold text-xs py-3 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                    isFull
                      ? 'bg-stadium-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gold-500 hover:bg-gold-400 text-slate-950 shadow-gold-glow'
                  }`}
                >
                  {isFull ? 'ROOM AT FULL CAPACITY' : (
                    <>
                      JOIN FRANCHISE DUGOUT <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

