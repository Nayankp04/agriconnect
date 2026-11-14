import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AccessDenied = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-rose-100 text-rose-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-2 right-1/2 translate-x-8 px-2 py-0.5 bg-rose-700 text-white font-mono font-black text-xs rounded-full">
            403
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have permission to access this area. Your current account role ({user?.role || 'Guest'}) does not grant authorization for this operation.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-1.5"
          >
            {user ? <Home className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {user ? 'My Dashboard' : 'Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;

