import React from 'react';
import Breadcrumbs from '../../components/Breadcrumbs';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Privacy Policy', active: true }]} />

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-4 space-y-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">AgriConnect Legal</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-400">Effective Date: November 14, 2026 &bull; Last Revised: November 2026</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">1. Information We Collect</h2>
            <p>
              AgriConnect collects personal and commercial information required to facilitate authentic agricultural transactions between Farmers, FPOs, Institutional Buyers, and Logistics Operators:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Contact & Identity Data:</strong> Name, verified email address, phone number, and physical farm/business addresses.</li>
              <li><strong>Agricultural Listing Data:</strong> Crop varieties, harvest dates, quantities in metric units (kg, quintal, ton, bag), pricing, and produce photographs.</li>
              <li><strong>Fleet & Transit Data:</strong> Vehicle registration numbers, gross payload capacities, driver contact numbers, and GPS routing corridors.</li>
              <li><strong>Authentication Data:</strong> Cryptographic password hashes (salted bcrypt) and Firebase Authentication session tokens. Plaintext passwords are never stored.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">2. How We Use Your Information</h2>
            <p>
              Your data is exclusively utilized to power the core functions of the AgriConnect agricultural network:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>Facilitating trade matching and executing binding purchase contracts between buyers and sellers.</li>
              <li>Routing transport dispatches to verified logistics vehicles with matching payload capacity.</li>
              <li>Delivering transactional notifications via email (via Resend HTTPS API) and real-time app notifications.</li>
              <li>Powering regional APMC price discovery and conversational AI assistance without selling your data to third-party advertisers.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">3. Data Protection & Security Controls</h2>
            <p>
              We implement stringent industry-standard data safeguards including TLS 1.3 transit encryption, MongoDB Atlas encrypted storage at rest, Firebase Identity token verification, and strict role-based access control (RBAC) ensuring users cannot inspect sensitive data outside their operational domain.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">4. Contact our Data Protection Officer</h2>
            <p>
              For data privacy inquiries, account deletion requests, or regulatory queries under Indian IT Act and Digital Personal Data Protection Act (DPDP), contact our compliance desk at <strong className="text-emerald-800">privacy@agriconnect.in</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

