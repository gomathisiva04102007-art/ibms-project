import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ibms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ibms_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('ibms_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.data.user);
          setProfile(res.data.profile);
          localStorage.setItem('ibms_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('[AuthContext] Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data;
    
    setToken(receivedToken);
    setUser(receivedUser);
    setProfile(receivedProfile);
    
    localStorage.setItem('ibms_token', receivedToken);
    localStorage.setItem('ibms_user', JSON.stringify(receivedUser));
    return res.data;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data;
    
    setToken(receivedToken);
    setUser(receivedUser);
    setProfile(receivedProfile);
    
    localStorage.setItem('ibms_token', receivedToken);
    localStorage.setItem('ibms_user', JSON.stringify(receivedUser));
    return res.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setProfile(null);
      setToken(null);
      localStorage.removeItem('ibms_token');
      localStorage.removeItem('ibms_user');
    }
  };

  const updateProfile = (updated) => {
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
