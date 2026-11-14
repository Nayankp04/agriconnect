import React from 'react';
import { Wrench, Clock, RefreshCw } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Wrench className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Scheduled Platform Maintenance</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            AgriConnect is currently undergoing scheduled platform upgrades to improve APMC price sync and high-volume harvest listings. We will be back online shortly.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Expected resolution: Within 30 minutes</span>
        </div>

        <div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Check System Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

