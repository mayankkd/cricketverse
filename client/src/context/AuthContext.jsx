import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cricketverse_token'));
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useNotification();

  // Load user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('cricketverse_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            // Expired or invalid token
            localStorage.removeItem('cricketverse_token');
            setToken(null);
            setUser(null);
          }
        } catch {
          // If offline or network error, retain cached user if any
          const cachedUser = localStorage.getItem('cricketverse_cached_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch {}
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login({ email, password });
      if (res.success) {
        localStorage.setItem('cricketverse_token', res.token);
        localStorage.setItem('cricketverse_cached_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        addToast({
          type: 'success',
          title: 'ACCESS GRANTED',
          message: `Welcome back, Manager ${res.user.username}!`
        });
        return { success: true };
      } else {
        addToast({
          type: 'error',
          title: 'LOGIN FAILED',
          message: res.message || 'Invalid email or password'
        });
        return { success: false, message: res.message };
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'NETWORK ERROR',
        message: 'Could not connect to CricketVerse game server.'
      });
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.register(userData);
      if (res.success) {
        localStorage.setItem('cricketverse_token', res.token);
        localStorage.setItem('cricketverse_cached_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        addToast({
          type: 'gold',
          title: 'FRANCHISE FOUNDED',
          message: `Welcome to CRICKETVERSE, Manager ${res.user.username}!`
        });
        return { success: true };
      } else {
        addToast({
          type: 'error',
          title: 'REGISTRATION ERROR',
          message: res.message || (res.errors ? res.errors[0] : 'Validation failed')
        });
        return { success: false, message: res.message || res.errors?.[0] };
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'SERVER ERROR',
        message: 'Registration failed due to a network error.'
      });
      return { success: false, message: err.message };
    }
  };

  const demoLogin = async () => {
    try {
      const res = await api.demoLogin();
      if (res.success) {
        localStorage.setItem('cricketverse_token', res.token);
        localStorage.setItem('cricketverse_cached_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        addToast({
          type: 'gold',
          title: 'VIP DEMO ACCESS',
          message: 'Signed in as Captain Legend (RCB Franchise)!'
        });
        return { success: true };
      } else {
        addToast({
          type: 'error',
          message: 'Failed to access demo profile.'
        });
        return { success: false };
      }
    } catch {
      // Fallback demo user if server not reached
      const fallbackUser = {
        _id: 'usr_demo_101',
        username: 'cricket_legend',
        email: 'captain@cricketverse.com',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        favoriteTeam: 'Royal Challengers Bengaluru',
        budget: 885000000,
        tier: 'Legend',
        level: 14,
        rating: 1845,
        stats: {
          matchesPlayed: 48,
          matchesWon: 34,
          matchesLost: 14,
          winRate: 70.8,
          tournamentsWon: 3,
          highestScore: 236,
          totalRuns: 4210,
          totalWickets: 126,
          auctionsWon: 18
        },
        preferences: {
          soundEnabled: true,
          commentaryLanguage: 'English (Harsha & Ravi)',
          graphicsQuality: 'Ultra HDR',
          simulationSpeed: 'Fast (2x)',
          pushNotifications: true
        }
      };
      setUser(fallbackUser);
      setToken('mock_demo_token');
      localStorage.setItem('cricketverse_token', 'mock_demo_token');
      localStorage.setItem('cricketverse_cached_user', JSON.stringify(fallbackUser));
      addToast({
        type: 'gold',
        title: 'VIP ACCESS ACTIVATED',
        message: 'Entered CricketVerse as VIP Captain Legend.'
      });
      return { success: true };
    }
  };

  const logout = () => {
    localStorage.removeItem('cricketverse_token');
    localStorage.removeItem('cricketverse_cached_user');
    setUser(null);
    setToken(null);
    addToast({
      type: 'info',
      title: 'SIGNED OUT',
      message: 'You have exited the dugout.'
    });
  };

  const updateUserProfile = async (updateData) => {
    try {
      const res = await api.updateProfile(updateData);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('cricketverse_cached_user', JSON.stringify(res.user));
        addToast({
          type: 'success',
          title: 'SETTINGS SAVED',
          message: 'Manager profile preferences updated.'
        });
        return { success: true };
      }
    } catch {
      // Offline fallback
      setUser((prev) => ({ ...prev, ...updateData }));
      addToast({
        type: 'success',
        title: 'SAVED LOCALLY',
        message: 'Settings updated.'
      });
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

