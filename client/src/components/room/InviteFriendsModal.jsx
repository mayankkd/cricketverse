import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Copy,
  Check,
  RefreshCw,
  Slash,
  Lock,
  Clock,
  Shield,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { sound } from '../../services/sound';

export const InviteFriendsModal = ({ room, isHost, onClose, onRoomUpdated }) => {
  const { addToast } = useNotification();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitePassword, setInvitePassword] = useState('');
  const [expiryHours, setExpiryHours] = useState('24');

  const invitation = room?.invitation;
  const inviteToken = invitation?.token;
  const inviteUrl = inviteToken
    ? `${window.location.origin}/rooms/invite/${inviteToken}`
    : `${window.location.origin}/rooms/${room?.roomCode}`;

  const isRevoked = invitation?.isRevoked;
  const isExpired = invitation?.expiresAt && new Date() > new Date(invitation.expiresAt);

  const handleCopy = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      addToast({
        type: 'success',
        title: 'INVITE LINK COPIED',
        message: 'Share this link with friends to invite them to the room.'
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to copy to clipboard.'
      });
    }
  };

  const handleNativeShare = async () => {
    sound.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room?.name} on CricketVerse`,
          text: `Enter the franchise arena! Room code: ${room?.roomCode}`,
          url: inviteUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    sound.playClick();
    setLoading(true);
    try {
      const res = await api.generateInvitation(room.roomCode, {
        expiresInHours: expiryHours ? Number(expiryHours) : null,
        password: invitePassword
      });
      if (res.success && res.room) {
        addToast({
          type: 'success',
          title: 'NEW LINK GENERATED',
          message: 'Previous invitation link was revoked and replaced with a fresh URL.'
        });
        if (onRoomUpdated) onRoomUpdated(res.room);
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to regenerate invitation link.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    sound.playClick();
    setLoading(true);
    try {
      const res = await api.revokeInvitation(room.roomCode);
      if (res.success && res.room) {
        addToast({
          type: 'warning',
          title: 'INVITATION REVOKED',
          message: 'No one can join using the previous invitation link.'
        });
        if (onRoomUpdated) onRoomUpdated(res.room);
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to revoke link.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-stadium-900 border border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stadium-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold uppercase text-white">
                INVITE FRIENDS & SCOUTS
              </h2>
              <p className="text-xs font-mono text-slate-400">
                OFFICIAL ARENA INVITATION PORTAL
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-stadium-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link Status Banner */}
        {isRevoked ? (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-xs font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>This invitation link has been REVOKED by the host. Regenerate a new one to invite friends.</span>
          </div>
        ) : isExpired ? (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-3 text-xs font-mono">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>This invitation link has EXPIRED. Regenerate to restore access.</span>
          </div>
        ) : null}

        {/* Shareable Link Box */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 font-bold uppercase block">
            Direct Shareable URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className={`flex-1 bg-stadium-950 border rounded-xl px-4 py-3 text-xs font-mono select-all focus:outline-none ${
                isRevoked || isExpired
                  ? 'border-red-500/30 text-slate-500 line-through'
                  : 'border-gold-500/40 text-gold-400'
              }`}
            />
            <button
              onClick={handleCopy}
              disabled={isRevoked || isExpired}
              className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-slate-950 font-display font-bold text-xs px-4 py-3 rounded-xl shadow-gold-glow flex items-center gap-1.5 flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Native Share Button */}
        {typeof navigator !== 'undefined' && navigator.share && !isRevoked && !isExpired && (
          <button
            onClick={handleNativeShare}
            className="w-full bg-stadium-850 hover:bg-stadium-800 border border-stadium-750 text-white font-display uppercase font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4 text-gold-400" /> SHARE VIA APPS (WHATSAPP, DISCORD, TELEGRAM)
          </button>
        )}

        {/* Link Metadata Indicators */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-stadium-950 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase">Expiration Policy</span>
            <span className="text-white font-bold flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              {invitation?.expiresAt
                ? new Date(invitation.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Never Expires'}
            </span>
          </div>
          <div className="bg-stadium-950 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase">Gate Security</span>
            <span className="text-white font-bold flex items-center gap-1 mt-0.5">
              <Lock className="w-3.5 h-3.5 text-pitch-400" />
              {invitation?.password ? 'Password Protected' : 'Open Access'}
            </span>
          </div>
        </div>

        {/* Host Controls: Expiry, Password, Revoke & Regenerate */}
        {isHost && (
          <div className="pt-4 border-t border-stadium-800 space-y-4">
            <h3 className="font-display text-xs font-bold uppercase text-slate-300 tracking-wider">
              HOST INVITATION SETTINGS
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Expiry Duration
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="w-full bg-stadium-950 border border-stadium-750 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">Never Expires</option>
                  <option value="1">1 Hour</option>
                  <option value="6">6 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="72">3 Days</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Passcode (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty for open"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full bg-stadium-950 border border-stadium-750 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loading}
                className="flex-1 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 border border-gold-500/40 font-display uppercase font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                REGENERATE LINK
              </button>

              <button
                type="button"
                onClick={handleRevoke}
                disabled={loading || isRevoked}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Slash className="w-3.5 h-3.5" /> REVOKE
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

