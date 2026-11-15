import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  Shield,
  Users,
  Eye,
  Lock,
  Globe,
  ArrowRight,
  Trophy,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { sound } from '../services/sound';
import { StadiumCard } from '../components/room/StadiumCard';
import { STADIUMS } from '../data/stadiumsData';

export const CreateRoom = () => {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('Cricketverse Arena Clash');
  const [teamName, setTeamName] = useState(user ? `${user.username}'s XI` : 'Bengaluru Titans');
  const [format, setFormat] = useState('T20');
  const [selectedStadiumId, setSelectedStadiumId] = useState('lords');
  const [selectedStadium, setSelectedStadium] = useState(STADIUMS[0]);
  const [stadiums, setStadiums] = useState(STADIUMS);
  const [loadingStadiums, setLoadingStadiums] = useState(false);

  // Capacity & Join Rules (Fixed Rules)
  const [maxTeams, setMaxTeams] = useState(6);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  // UI & Loading States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stadiumGalleryOpen, setStadiumGalleryOpen] = useState(false);

  // 3 Fixed Cricket Formats with Exact Purses
  const formats = [
    {
      id: 'Test',
      label: 'TEST CRICKET',
      purse: 50,
      badge: '50 POINTS PURSE',
      desc: '2 innings per side, multi-session stamina, pitch deterioration'
    },
    {
      id: 'ODI',
      label: 'ONE DAY INTERNATIONAL',
      purse: 40,
      badge: '40 POINTS PURSE',
      desc: '50 overs tactical battle, powerplay restrictions, DLS adjustments'
    },
    {
      id: 'T20',
      label: 'T20 CRICKET',
      purse: 30,
      badge: '30 POINTS PURSE',
      desc: '20 overs high-intensity action, death overs hitting, fast run chases'
    }
  ];

  // Fetch available stadiums on mount
  useEffect(() => {
    let mounted = true;
    const fetchStadiums = async () => {
      try {
        const res = await api.getStadiums();
        if (res.success && res.stadiums && mounted) {
          setStadiums(res.stadiums);
          const defaultStad = res.stadiums.find(s => s.id === 'lords') || res.stadiums[0];
          setSelectedStadium(defaultStad);
          setSelectedStadiumId(defaultStad.id);
        }
      } catch (err) {
        console.error('Error fetching stadiums:', err);
      } finally {
        if (mounted) setLoadingStadiums(false);
      }
    };

    fetchStadiums();

    return () => {
      mounted = false;
    };
  }, []);

  // Update default team name when user logs in
  useEffect(() => {
    if (user?.username && teamName === 'Bengaluru Titans') {
      setTeamName(`${user.username}'s XI`);
    }
  }, [user]);

  const handleSelectStadium = (stad) => {
    sound.playClick();
    setSelectedStadium(stad);
    setSelectedStadiumId(stad.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions

    sound.playClick();
    setErrorMsg('');

    // 1. Validation
    if (!name.trim() || name.trim().length < 3) {
      setErrorMsg('Room title must be at least 3 characters long.');
      return;
    }

    if (!teamName.trim()) {
      setErrorMsg('Please specify your team or franchise name.');
      return;
    }

    setLoading(true);

    try {
      // If user is not yet logged in, seamlessly create a host session first
      if (!isAuthenticated && !user) {
        await demoLogin();
      }

      const selectedFormatObj = formats.find(f => f.id.toUpperCase() === format.toUpperCase()) || formats[2];
      const payload = {
        name: name.trim(),
        format: selectedFormatObj.id,
        budgetPerTeam: selectedFormatObj.purse,
        maxTeams: Number(maxTeams), // Fixed max 6
        minPlayers: 2, // Fixed min 2
        stadiumId: selectedStadiumId,
        stadium: selectedStadium,
        isPrivate: Boolean(isPrivate),
        password: password ? password.trim() : '',
        allowSpectators: Boolean(allowSpectators),
        allowPlayerJoining: true,
        spectatorChatEnabled: true,
        teamName: teamName.trim()
      };

      const res = await api.createRoom(payload);

      if (res?.success && res?.room && res.room._id) {
        addToast({
          type: 'success',
          title: 'ROOM OPENED',
          message: `Lobby created with code: ${res.room.roomCode}`
        });
        navigate(`/rooms/${res.room.roomCode}`);
      } else {
        const errorText = res?.message || 'Server did not return a valid room.';
        setErrorMsg(errorText);
        addToast({
          type: 'error',
          title: 'FAILED TO CREATE',
          message: errorText
        });
      }
    } catch (err) {
      console.error('Room creation exception:', err);
      setErrorMsg(err.message || 'Failed to create room. Please check connection and retry.');
      addToast({
        type: 'error',
        title: 'ROOM ERROR',
        message: err.message || 'Could not create room'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pitch-500/10 border border-pitch-500/40 text-pitch-400 mb-3 shadow-pitch-glow">
          <PlusCircle className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
          CREATE MULTIPLAYER ROOM
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          SET ROOM NAME, SELECT FORMAT & STADIUM, AND INVITE FRIENDS
        </p>
      </div>

      {/* Error Feedback Banner (Preserves Form Values) */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-mono flex items-start gap-3 shadow-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-white block font-bold mb-0.5">ROOM SETUP ERROR</strong>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            className="text-red-400 hover:text-white font-bold text-sm"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Main Creation Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-stadium-900 border border-stadium-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
      >
        {/* Section 1: Room Name & Host Team Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Super League"
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pitch-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Your Franchise / Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Bengaluru Titans XI"
              className="w-full bg-stadium-950 border border-stadium-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pitch-500 transition-colors"
            />
          </div>
        </div>

        {/* Section 2: Cricket Format Selection (TEST 50, ODI 40, T20 30) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono font-bold uppercase text-slate-300">
              Cricket Format & Auction Purse
            </label>
            <span className="text-[10px] font-mono text-gold-400">
              Independent purse per participant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {formats.map((fmt) => {
              const isSelected = format.toUpperCase() === fmt.id.toUpperCase();
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setFormat(fmt.id);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-gold-500/10 border-gold-500 text-gold-300 shadow-gold-glow ring-1 ring-gold-500/50'
                      : 'bg-stadium-950 border-stadium-800 text-slate-400 hover:text-white hover:border-stadium-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-black text-sm uppercase text-white">
                      {fmt.label}
                    </span>
                    <Trophy className={`w-4 h-4 ${isSelected ? 'text-gold-400' : 'text-slate-600'}`} />
                  </div>
                  <span className="inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 mb-2">
                    {fmt.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    {fmt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Host Stadium Selection (15 Authentic Grounds) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-300">
                Match Stadium & Pitch Conditions
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                Pitch characteristics directly influence seam, bounce and spin
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setStadiumGalleryOpen(!stadiumGalleryOpen);
              }}
              className="text-xs font-mono text-gold-400 hover:text-gold-300 font-bold underline"
            >
              {stadiumGalleryOpen ? 'Hide Ground Grid ▲' : 'Browse All 15 Stadiums ▼'}
            </button>
          </div>

          {/* Selected Stadium Quick Card */}
          {selectedStadium && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-stadium-950 via-stadium-900 to-amber-950/30 border border-gold-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-stadium-950 flex-shrink-0 relative border border-white/10">
                  <img
                    src={selectedStadium.imageUrl}
                    alt={selectedStadium.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono text-gold-400 px-1 rounded font-bold">
                    {selectedStadium.pitchType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-wider block">
                    CHOSEN VENUE
                  </span>
                  <h3 className="font-display font-black text-base uppercase text-white leading-tight">
                    {selectedStadium.fullName || selectedStadium.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedStadium.city}, {selectedStadium.country} • Pace: {selectedStadium.paceSupport}% • Spin: {selectedStadium.spinSupport}%
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStadiumGalleryOpen(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stadium-850 hover:bg-stadium-800 border border-gold-500/40 text-gold-300 font-mono text-xs font-bold transition-colors"
              >
                Change Ground
              </button>
            </div>
          )}

          {/* Expandable Stadium Gallery (All 15 Stadiums) */}
          {stadiumGalleryOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-stadium-950 border border-stadium-800 space-y-3"
            >
              <span className="text-xs font-mono text-slate-400 block font-bold">
                SELECT ONE STADIUM FOR THIS ARENA:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {stadiums.map((stad) => (
                  <StadiumCard
                    key={stad.id}
                    stadium={stad}
                    isSelected={selectedStadiumId === stad.id}
                    isHost={true}
                    onSelect={handleSelectStadium}
                    showFullDetails={true}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Section 4: Player Capacity & Fixed Rules (Min 2, Max 6) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-stadium-950 border border-stadium-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
              Active Players Capacity
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-2xl text-pitch-400">6</span>
              <span className="text-xs font-mono text-slate-500 font-bold">MAX</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Fixed capacity (2 to 6 managers)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stadium-950 border border-stadium-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
              Minimum Players to Start
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-2xl text-gold-400">2</span>
              <span className="text-xs font-mono text-slate-500 font-bold">PLAYERS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Game starts once 2 join
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stadium-950 border border-stadium-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
              Spectator Access
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-2xl text-electric-400">∞</span>
              <span className="text-xs font-mono text-slate-500 font-bold">OBSERVERS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              7th+ join as Spectators
            </span>
          </div>
        </div>

        {/* Section 5: Join Permissions & Spectators Toggle */}
        <div className="p-4 rounded-2xl bg-stadium-950 border border-stadium-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-electric-400" />
              <span className="text-xs font-mono font-bold uppercase text-white">
                Spectator Joining Enabled
              </span>
            </div>
            <span className="text-[10px] font-mono text-electric-400 bg-electric-500/20 px-2.5 py-1 rounded-full font-bold">
              ALLOW SPECTATORS
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
            Friends opening your invite link can choose <strong>JOIN AS PLAYER</strong> (slots 1–6) or <strong>JOIN AS SPECTATOR</strong>. Additional friends beyond 6 automatically spectate live.
          </p>
        </div>

        {/* Section 6: Optional Password Protection */}
        <div className="p-4 rounded-2xl bg-stadium-950 border border-stadium-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPrivate ? <Lock className="w-4 h-4 text-gold-400" /> : <Globe className="w-4 h-4 text-pitch-400" />}
              <span className="text-xs font-mono font-bold uppercase text-white">
                {isPrivate ? 'Private Room (Password Protected)' : 'Open Room'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsPrivate(!isPrivate);
              }}
              className={`text-xs font-display font-bold uppercase px-3 py-1.5 rounded-xl border transition-colors ${
                isPrivate
                  ? 'bg-gold-500/20 text-gold-400 border-gold-500/40'
                  : 'bg-stadium-800 text-slate-300 border-stadium-700'
              }`}
            >
              {isPrivate ? 'Remove Password' : 'Add Password'}
            </button>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Room Access Password
              </label>
              <input
                type="password"
                required={isPrivate}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for room access"
                className="w-full bg-stadium-900 border border-stadium-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          )}
        </div>

        {/* Submit & Create Room Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pitch-600 hover:bg-pitch-500 disabled:opacity-50 text-white font-display uppercase font-bold text-sm py-4 rounded-xl shadow-pitch-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ESTABLISHING ARENA & INVITATION LINK...
            </span>
          ) : (
            <>
              CREATE ROOM & OPEN DUGOUT LOBBY <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
