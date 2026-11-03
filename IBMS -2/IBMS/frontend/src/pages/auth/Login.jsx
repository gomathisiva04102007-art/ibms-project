import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import Alert from '../../components/common/Alert';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'Password123!',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || [502, 503].includes(err.response?.status)) {
        setError(
          'Cannot connect to the login server. Start the backend with "npm run backend", then try again.'
        );
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'Password123!',
      rememberMe: true,
    });
    setError('');
  };

  return (
    <div>
      <div className="mb-6 text-left">
        <h3 className="text-[2rem] font-bold tracking-tight text-slate-800">Welcome back</h3>
        <p className="mt-1 text-sm text-slate-500">Sign in to your billing portal</p>
      </div>

      <Alert
        type="error"
        message={error}
        onClose={() => setError('')}
        className="mb-5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-[0.93rem] shadow-sm"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="demo@example.com"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-700">
              Password
            </label>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password123!"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2d78ea] to-[#1c67d8] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(59,122,230,0.35)] transition-all hover:brightness-105 disabled:opacity-50"
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In to Workspace
            </>
          )}
        </button>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleFillDemo}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Quick Demo: Load College Project Credentials
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:underline">
          Create new account
        </Link>
      </div>
    </div>
  );
}
