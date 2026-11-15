import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Users,
  Settings2,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { sound } from '../../services/sound';

export const VoiceChatBar = ({ matchId, user, isSpectator = false }) => {
  const [channelData, setChannelData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (matchId) {
      api.getVoiceChatToken(matchId, {
        userId: user?._id || 'guest',
        username: user?.username || 'Player'
      }).then(res => {
        if (res.success) {
          setChannelData(res);
          setConnected(true);
        }
      }).catch(console.error);
    }
  }, [matchId, user]);

  const toggleMute = () => {
    if (isSpectator) return;
    sound.playClick();
    setIsMuted(!isMuted);
  };

  const toggleDeafen = () => {
    sound.playClick();
    setIsDeafened(!isDeafened);
  };

  // Simulate speaking cadence on speech / audio
  useEffect(() => {
    if (!isMuted && !isSpectator) {
      const interval = setInterval(() => {
        setIsSpeaking(Math.random() < 0.35);
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setIsSpeaking(false);
    }
  }, [isMuted, isSpectator]);

  if (!connected) return null;

  return (
    <div className="bg-stadium-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 px-4 flex items-center justify-between gap-4 text-xs font-mono shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-pitch-500' : 'bg-red-500'} ${isSpeaking ? 'animate-ping' : ''}`} />
          <span className="font-display font-bold text-slate-300 uppercase">
            VOICE CHANNEL (STADIUM COMMS)
          </span>
        </div>

        {isSpectator ? (
          <span className="text-[10px] bg-electric-500/20 text-electric-300 px-2 py-0.5 rounded border border-electric-500/30">
            SPECTATOR LISTEN-ONLY
          </span>
        ) : (
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
            isSpeaking ? 'bg-pitch-500 text-slate-950 shadow-green-glow' : 'bg-stadium-900 text-slate-400'
          }`}>
            {isSpeaking ? 'SPEAKING 🎙️' : 'CONNECTED'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isSpectator && (
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl transition-colors ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-stadium-900 text-slate-300 hover:text-white border border-white/5'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={toggleDeafen}
          className={`p-2 rounded-xl transition-colors ${
            isDeafened
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-stadium-900 text-slate-300 hover:text-white border border-white/5'
          }`}
          title={isDeafened ? 'Undeafen Voice' : 'Deafen Voice'}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

