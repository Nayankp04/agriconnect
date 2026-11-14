import React from 'react';
import Breadcrumbs from '../../components/Breadcrumbs';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Cookie Policy', active: true }]} />

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-4 space-y-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">AgriConnect Compliance</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Cookie & Storage Policy</h1>
            <p className="text-xs text-slate-400">Effective Date: November 14, 2026</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">1. What Technologies We Use</h2>
            <p>
              AgriConnect utilizes secure browser cookies, local storage (`localStorage`), and session storage to maintain authenticated user sessions, retain user preferences, and power the purchase cart workflow.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">2. Categories of Storage</h2>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600">
              <li><strong>Essential Authentication:</strong> `agriconnect_token` stores your JSON Web Token securely for authorized API requests.</li>
              <li><strong>Cart & Purchase State:</strong> `agriconnect_cart` preserves pending order lots during your session.</li>
              <li><strong>Security & Session:</strong> Firebase Authentication uses standard cross-site cookies to verify email verification statuses.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">3. Managing Preferences</h2>
            <p>
              You can clear cookies and local storage directly through your browser settings at any time. Note that clearing authentication tokens will log you out of your AgriConnect session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;

