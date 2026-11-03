import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a1a34] bg-gradient-to-br from-[#0d2548] via-[#0a1a34] to-[#07172d] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[470px] flex-col items-center justify-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-[0_12px_32px_rgba(12,25,51,0.5)] backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2a6fe8] shadow-lg shadow-blue-900/40">
            <Receipt className="h-7 w-7 text-white" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-[2.2rem]">
          Billing &amp; Invoice System
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300 sm:text-base">
          Financial Management, Indian GST Invoicing &amp; Payment Tracking
        </p>

        <div className="mt-8 w-full rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(1,8,20,0.35)] sm:p-8">
          <Outlet />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-300 sm:text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>GSTIN &amp; Multi-Tax Compliant Portal</span>
        </div>
      </div>
    </div>
  );
}
