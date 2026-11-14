import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Users,
  TrendingUp,
  ShieldCheck,
  Truck,
  Building2,
  CheckCircle2,
  ArrowRight,
  Award,
  Globe2
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'About Us', active: true }]} />

        {/* Hero Section */}
        <div className="relative bg-emerald-900 text-white rounded-3xl p-8 sm:p-14 overflow-hidden shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-700/30 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 rounded-full text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <Sprout className="w-3.5 h-3.5" /> India's Agri-Value Network
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Transforming Agricultural Trade from Farm Gate to Final Destination
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              AgriConnect is an end-to-end digital agribusiness operating system. We eliminate middlemen inefficiencies,
              empower Farmer Producer Organizations (FPOs), provide institutional buyers direct sourcing transparency,
              and coordinate on-demand cold & dry transport logistics.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to="/marketplace"
                className="px-6 py-3 bg-white text-emerald-900 font-bold text-xs rounded-xl shadow-md hover:bg-emerald-50 transition-all inline-flex items-center gap-2"
              >
                Explore Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Join AgriConnect
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-black text-emerald-700">12,000+</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Farmers Enrolled</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-black text-emerald-700">450+</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Verified FPOs</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-black text-emerald-700">₹85 Cr+</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Gross Trade Facilitated</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="text-3xl font-black text-emerald-700">98.4%</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">On-Time Logistics</div>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900">How AgriConnect Empowers Every Stakeholder</h2>
            <p className="text-xs text-slate-500 mt-2">
              Our 4-way platform creates equitable prosperity across the entire food supply chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">For Farmers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct market access without commission agents. List harvest lots with guaranteed minimum benchmark pricing and instant digital payments.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">For FPOs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Commodity pooling tools, member farmer contribution tracking, grade-based inventory lots, and bulk institutional sales contracts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">For Buyers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Post purchase requirements, discover verified harvest origins, track cold chain integrity, and negotiate secure forward supply contracts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">For Logistics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reduce dead-haul miles. Receive automated dispatch requests matched to truck payload capacity and service corridors across Karnataka & South India.
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Our Core Mission</span>
            <h2 className="text-2xl font-black text-slate-900">A Resilient, Transparent, and Profitable Agrarian Economy</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Founded with the vision to bridge rural producers with urban processing and retail hubs, AgriConnect leverages modern web technology,
              multilingual voice AI assistance, and geo-targeted logistics coordination to eliminate post-harvest distress sales and stabilize food inflation.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Real-time market price discovery and APMC trend tracking
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Multilingual Voice AI assistant supporting regional dialects
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Verified escrow-style purchase orders and shipment tracking
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-tr from-emerald-100 via-emerald-50 to-teal-100 rounded-3xl p-8 border border-emerald-200/50 flex flex-col justify-center items-center text-center space-y-4">
            <Award className="w-16 h-16 text-emerald-700" />
            <h3 className="text-lg font-black text-emerald-950">APMC & Agribusiness Direct Compliance</h3>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Operating in full compliance with Karnataka Agricultural Produce Marketing (Regulation and Development) guidelines and Model FPO promotion policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

