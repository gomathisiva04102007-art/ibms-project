import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  Plus,
  FileText,
  Users,
  Package,
  Building2,
  ChevronDown,
} from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const dropdownRef = useRef(null);
  const quickRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (quickRef.current && !quickRef.current.contains(e.target)) {
        setQuickCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const businessName = profile?.businessName || user?.businessName || 'Billing & Invoicing';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200 shadow-sm no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="p-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {businessName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
              {businessName}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              GST: {profile?.gstin || 'Not Configured'} • {profile?.state || 'India'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Action Dropdown */}
        <div className="relative" ref={quickRef}>
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {quickCreateOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn">
              <Link
                to="/invoices/new"
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
              >
                <FileText className="w-4 h-4 text-primary-600" />
                Create Invoice
              </Link>
              <Link
                to="/customers"
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                Add Customer
              </Link>
              <Link
                to="/products"
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Package className="w-4 h-4 text-amber-600" />
                Add Product
              </Link>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 hidden md:block" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                Company Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left border-t border-slate-100 mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
