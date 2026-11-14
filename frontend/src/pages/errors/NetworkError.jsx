import React from 'react';
import { WifiOff, RefreshCw, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

const NetworkError = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <WifiOff className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Connection Interrupted</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            We are unable to reach the AgriConnect database or server. Please check your cellular/Wi-Fi connection. If you are experiencing rural connectivity issues, SMS & voice commands remain active.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
          <Link
            to="/contact"
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5"
          >
            <PhoneCall className="w-4 h-4" /> Offline Helpline
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NetworkError;

