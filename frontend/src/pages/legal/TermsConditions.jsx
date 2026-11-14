import React from 'react';
import Breadcrumbs from '../../components/Breadcrumbs';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Terms of Service', active: true }]} />

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-4 space-y-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">AgriConnect Agreement</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Terms & Conditions of Service</h1>
            <p className="text-xs text-slate-400">Effective Date: November 14, 2026</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or executing transactions on AgriConnect ("Platform"), you agree to be bound by these Terms and Conditions. These terms govern the relationship between agricultural producers, FPOs, buyers, and logistics providers.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">2. Stakeholder Eligibility and Account Verification</h2>
            <p>
              All members must undergo email verification via Firebase Authentication. Farmers and FPOs warrant that produce listed corresponds to genuine agricultural lots with accurate quantity weights and grades. Misrepresentation of inventory or quantities is grounds for immediate account suspension.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">3. Orders, Automatic Stock Reservation & Settlement</h2>
            <p>
              When a purchase order is submitted, the Platform automatically reserves the requested quantity from the seller's available inventory pool. The seller retains the right to accept or decline the purchase order. Upon acceptance, both parties are bound to fulfill the transaction according to agreed price terms and APMC quality benchmarks.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">4. Logistics & Cargo Transport Commitments</h2>
            <p>
              Logistics operators listing vehicles agree to maintain valid fitness certificates, vehicle registrations, and commercial transit insurance. Cargo damage or transit delays due to mechanical neglect are subject to resolution under the Motor Vehicles Act and regional carrier regulations.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">5. Limitation of Liability</h2>
            <p>
              AgriConnect acts as a technology platform facilitating direct trade and transit coordination. While we provide automated stock verification and dispute escalation mechanisms, AgriConnect is not an insurer of agricultural perishability arising from natural weather disruptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;

