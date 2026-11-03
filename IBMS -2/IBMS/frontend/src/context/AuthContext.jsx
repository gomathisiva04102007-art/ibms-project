import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getUser, login as identityLogin, signup, logout as identityLogout, handleAuthCallback, onAuthChange } from '@netlify/identity';
import { authService } from '../services/api';
import { authErrorMessage } from '../utils/authErrors';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const initialization = useRef(null);

  const loadWorkspace = async () => {
    const { data } = await authService.getMe();
    setUser(data.user);
    setProfile(data.profile);
    return data;
  };

  useEffect(() => {
    let active = true;
    // Discard legacy sessions; only Identity sessions authenticate the deployed API.
    localStorage.removeItem('ibms_token');
    localStorage.removeItem('ibms_user');
    const unsubscribe = onAuthChange((event) => {
      if (active && event === 'logout') { setUser(null); setProfile(null); }
    });
    // Reuse the callback exchange during React StrictMode's effect replay.
    initialization.current ||= (async () => {
      await handleAuthCallback();
      if (await getUser()) return (await authService.getMe()).data;
      return null;
    })();
    (async () => {
      try {
        const data = await initialization.current;
        if (active && data) { setUser(data.user); setProfile(data.profile); }
      } catch (error) {
        if (active) setAuthError(authErrorMessage(error, 'Unable to confirm your email or restore your session. Please sign in again, or request a new confirmation link.'));
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; unsubscribe(); };
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    await identityLogin(email.trim(), password);
    return loadWorkspace();
  };

  const register = async ({ email, password, name, businessName, phone }) => {
    const identity = await signup(email.trim(), password, { full_name: name, businessName, phone });
    if (!identity.confirmedAt) return { confirmationRequired: true };
    return loadWorkspace();
  };

  const logout = async () => {
    await identityLogout();
    setUser(null); setProfile(null);
  };

  // Repeating signup is Identity's supported resend flow for an unconfirmed account.
  // Passwords stay in form memory and are never persisted by this app.
  const resendConfirmation = (email, password) => signup(email.trim(), password);

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, clearAuthError: () => setAuthError(''), isAuthenticated: !!user, login, register, resendConfirmation, logout, updateProfile: setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
