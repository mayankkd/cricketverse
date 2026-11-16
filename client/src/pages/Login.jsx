import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../services/sound';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    sound.playClick();
    setErrorMsg('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(redirectPath);
    } else {
      setErrorMsg(result.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleDemo = async () => {
    sound.playBidChime();
    setLoading(true);
    const result = await demoLogin();
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative">
      {/* Background Floodlight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-stadium-900/90 border border-stadium-750 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/40 text-gold-400 mb-3 shadow-gold-glow">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl font-black uppercase text-white tracking-wide">
            MANAGER SIGN IN
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            ACCESS YOUR CRICKETVERSE DUGOUT
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="captain@cricketverse.com"
                className="w-full bg-stadium-950 border border-stadium-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors focus-visible:ring-2 focus-visible:ring-gold-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stadium-950 border border-stadium-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors focus-visible:ring-2 focus-visible:ring-gold-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-slate-950 font-display uppercase font-bold text-sm py-3 rounded-xl shadow-gold-glow transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                VERIFYING CREDENTIALS...
              </span>
            ) : (
              <>
                ENTER ARENA <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center justify-between gap-4">
          <div className="flex-1 h-px bg-stadium-800" />
          <span className="text-[11px] font-mono text-slate-500 uppercase">OR INSTANT ACCESS</span>
          <div className="flex-1 h-px bg-stadium-800" />
        </div>

        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full bg-stadium-950 hover:bg-stadium-800 border border-gold-500/40 text-gold-300 font-display uppercase font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Flame className="w-4 h-4 text-gold-400" /> 1-CLICK VIP DEMO LOGIN (CAPTAIN)
        </button>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have a franchise yet?{' '}
          <Link to="/register" className="text-gold-400 hover:underline font-bold">
            Register Manager Profile
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

