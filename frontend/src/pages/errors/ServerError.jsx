import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, RotateCw, Home } from 'lucide-react';

const ServerError = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <AlertOctagon className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-2 right-1/2 translate-x-8 px-2 py-0.5 bg-amber-600 text-white font-mono font-black text-xs rounded-full">
            500
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Internal Server Encountered</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our agricultural systems encountered an unexpected technical glitch. We've logged the incident and our engineering team is addressing it.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5"
          >
            <RotateCw className="w-4 h-4" /> Retry Page
          </button>
          <Link
            to="/"
            className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerError;

