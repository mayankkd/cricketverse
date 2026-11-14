import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Zap, X } from 'lucide-react';
import { sound } from '../services/sound';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', title = null, duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    
    // Play appropriate sound
    if (type === 'gold' || type === 'success') {
      sound.playBidChime();
    } else {
      sound.playClick();
    }

    setToasts((prev) => [...prev, { id, message, type, title }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 relative overflow-hidden ${
                toast.type === 'gold'
                  ? 'bg-stadium-900/95 border-gold-500/60 text-gold-300 shadow-gold-glow'
                  : toast.type === 'success'
                  ? 'bg-stadium-900/95 border-pitch-500/60 text-pitch-400 shadow-pitch-glow'
                  : toast.type === 'error'
                  ? 'bg-stadium-900/95 border-red-500/60 text-red-400'
                  : 'bg-stadium-900/95 border-stadium-700 text-slate-200'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {toast.type === 'gold' && <Zap className="w-5 h-5 text-gold-400" />}
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-pitch-400" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-electric-400" />}
              </div>
              <div className="flex-1 text-sm">
                {toast.title && <p className="font-display uppercase tracking-wider text-xs font-bold mb-0.5 text-white">{toast.title}</p>}
                <p className="font-medium text-slate-200">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

