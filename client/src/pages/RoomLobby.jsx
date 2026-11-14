import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Copy,
  Check,
  Send,
  Flame,
  Shield,
  Coins,
  Radio,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { sound } from '../services/sound';

export const RoomLobby = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.getRoom(roomCode);
        if (res.success && res.room) {
          setRoom(res.room);
        } else {
          // If not found from server, fallback to default seed room
          setRoom({
            roomCode: roomCode || 'IPL-2026',
            name: 'Mega IPL Auction & Super League',
            hostUsername: 'cricket_legend',
            status: 'waiting',
            format: 'T20',
            maxTeams: 8,
            budgetPerTeam: 1000000000,
            participants: [
              { userId: 'u1', username: 'cricket_legend', teamName: 'Bangalore Royal Titans', isReady: true, isHost: true, budgetRemaining: 1000000000 },
              { userId: user?._id || 'u2', username: user?.username || 'You', teamName: `${user?.username || 'Your'}'s XI`, isReady: false, isHost: false, budgetRemaining: 1000000000 }
            ],
            chatMessages: [
              { id: '1', sender: 'System', text: `Welcome to room ${roomCode}! Assemble your franchise.` }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching room:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomCode, user]);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    addToast({ type: 'success', message: 'Room code copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    sound.playClick();
    if (!room) return;
    try {
      const res = await api.toggleReady(roomCode);
      if (res.success && res.room) {
        setRoom(res.room);
      } else {
        // Toggle in local state
        setRoom((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.username === user?.username || p.userId === user?._id
              ? { ...p, isReady: !p.isReady }
              : p
          )
        }));
      }
    } catch {
      setRoom((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.username === user?.username || p.userId === user?._id
            ? { ...p, isReady: !p.isReady }
            : p
        )
      }));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sound.playClick();

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: user?.username || 'Manager',
      text: chatInput.trim()
    };

    setRoom((prev) => ({
      ...prev,
      chatMessages: [...(prev.chatMessages || []), newMsg]
    }));

    setChatInput('');

    try {
      await api.sendRoomChat(roomCode, newMsg.text);
    } catch {}
  };

  const handleStartAuction = () => {
    sound.playBidChime();
    navigate(`/auction?room=${roomCode}`);
  };

  if (loading || !room) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gold-400 font-mono text-sm">
        CONNECTING TO ARENA DUGOUT...
      </div>
    );
  }

  const isCurrentUserReady = room.participants?.find(
    (p) => p.username === user?.username || p.userId === user?._id
  )?.isReady;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Room Header Banner */}
      <div className="bg-stadium-900 border border-stadium-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase">
              {room.format} ARENA
            </span>
            <span className="text-xs font-mono text-slate-400">
              Host: <strong className="text-white">{room.hostUsername}</strong>
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            {room.name}
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Purse: ₹{(room.budgetPerTeam / 10000000).toFixed(0)} Cr per franchise • Max {room.maxTeams} Teams
          </p>
        </div>

        {/* Room Code Card & Copy */}
        <div className="flex items-center gap-4 bg-stadium-950 p-4 rounded-2xl border border-gold-500/30">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Share Code</span>
            <span className="font-mono text-xl font-black text-gold-400 tracking-wider">
              {room.roomCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2.5 rounded-xl bg-stadium-900 hover:bg-stadium-850 border border-stadium-700 text-slate-300 hover:text-white transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-5 h-5 text-pitch-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Participants & Dugout Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participants Slots List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase text-white">
                FRANCHISE DUGOUT ({room.participants?.length || 0} / {room.maxTeams || 8})
              </h2>
              <p className="text-xs font-mono text-slate-400">REGISTERED TEAMS IN LOBBY</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleReady}
                className={`font-display uppercase font-bold text-xs px-4 py-2 rounded-xl transition-all ${
                  isCurrentUserReady
                    ? 'bg-pitch-500 text-slate-950 shadow-pitch-glow'
                    : 'bg-stadium-800 text-slate-300 hover:bg-stadium-750 border border-stadium-700'
                }`}
              >
                {isCurrentUserReady ? '✓ READY' : 'SET AS READY'}
              </button>

              <button
                onClick={handleStartAuction}
                className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-5 py-2 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Flame className="w-4 h-4" /> START AUCTION
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {room.participants?.map((participant, index) => (
              <div
                key={participant.userId || index}
                className={`p-4 rounded-2xl border transition-all ${
                  participant.isReady
                    ? 'bg-stadium-900/90 border-pitch-500/50 shadow-pitch-glow'
                    : 'bg-stadium-900 border-stadium-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-stadium-950 flex items-center justify-center font-display font-bold text-xs text-gold-400 border border-white/5">
                      #{index + 1}
                    </span>
                    <span className="font-display font-bold text-sm text-white truncate max-w-[140px]">
                      {participant.username}
                    </span>
                  </div>
                  {participant.isHost && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded">
                      HOST
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-stadium-950 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Franchise</span>
                    <span className="font-display font-bold text-slate-200">{participant.teamName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Status</span>
                    <span className={`font-mono font-bold text-[11px] ${
                      participant.isReady ? 'text-pitch-400' : 'text-slate-400'
                    }`}>
                      {participant.isReady ? 'READY' : 'WAITING'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, (room.maxTeams || 8) - (room.participants?.length || 0)) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-4 rounded-2xl border border-dashed border-stadium-800 bg-stadium-950/40 flex items-center justify-center text-slate-600 font-mono text-xs uppercase"
              >
                + Empty Slot #{ (room.participants?.length || 0) + i + 1 }
              </div>
            ))}
          </div>
        </div>

        {/* Dugout Live Chat (1 Col) */}
        <div className="bg-stadium-900 border border-stadium-800 p-5 rounded-3xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-stadium-800 mb-3">
            <div>
              <h3 className="font-display text-base font-bold uppercase text-white">DUGOUT COMMS</h3>
              <p className="text-[10px] font-mono text-pitch-400">LIVE MULTIPLAYER CHAT</p>
            </div>
            <Radio className="w-4 h-4 text-pitch-400 animate-pulse" />
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
            {room.chatMessages?.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-xl text-xs ${
                  msg.sender === 'System'
                    ? 'bg-stadium-950/80 border border-white/5 text-gold-300 font-mono text-[11px]'
                    : msg.sender === user?.username
                    ? 'bg-gold-500/10 border border-gold-500/30 text-white ml-4'
                    : 'bg-stadium-800 text-slate-300 mr-4'
                }`}
              >
                <span className="font-bold text-[10px] block font-display uppercase tracking-wider text-slate-400 mb-0.5">
                  {msg.sender}
                </span>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-stadium-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message managers..."
              className="flex-1 bg-stadium-950 border border-stadium-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              className="bg-gold-500 hover:bg-gold-400 text-slate-950 p-2.5 rounded-xl shadow-gold-glow flex-shrink-0 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
