import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Sprout className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-2 right-1/2 translate-x-8 px-2 py-0.5 bg-rose-600 text-white font-mono font-black text-xs rounded-full">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The crop listing, dashboard route, or page you were looking for doesn't exist or has been moved to a new APMC lot.
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
            to="/"
            className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" /> AgriConnect Home
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          Looking for produce lots or buyer demands?{' '}
          <Link to="/marketplace" className="text-emerald-700 font-bold hover:underline">
            Visit Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

