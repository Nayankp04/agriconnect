import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Sprout,
  Users,
  Building2,
  Truck,
  Mic,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState('farmer');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Help & User Guides', active: true }]} />

        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-3xl p-8 sm:p-12 shadow-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <BookOpen className="w-3.5 h-3.5" /> Comprehensive Platform Guide
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">AgriConnect Knowledge Base & User Guides</h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Everything you need to know about managing agricultural inventory, negotiating fair trade orders,
            tracking shipments, and interacting with our Multilingual Voice AI assistant.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('farmer')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'farmer'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sprout className="w-4 h-4" /> Farmer Guide
          </button>
          <button
            onClick={() => setActiveTab('fpo')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'fpo'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> FPO Guide
          </button>
          <button
            onClick={() => setActiveTab('buyer')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'buyer'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" /> Buyer Guide
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'logistics'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" /> Logistics Guide
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'voice'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice AI Assistant
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {activeTab === 'farmer' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Farmer Workflow & Inventory Management</h3>
                <p className="text-xs text-slate-500 mt-1">Step-by-step instructions for farmers selling produce on AgriConnect.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-sm text-slate-900">Add Crops & Produce</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Navigate to <strong>Add Produce</strong>. Enter crop name, category (Grains, Pulses, Fruits, Vegetables), available quantity, and unit (kg, quintal, ton, bag). Upload photos of the harvest lot.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-sm text-slate-900">Adjust Live Stock</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    From <strong>My Produce</strong>, view listed inventory. Click <strong>Adjust Stock</strong> to increase or decrease quantities as you sell or harvest more. Toggle status between Available, Sold Out, or Unavailable.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="font-bold text-sm text-slate-900">Receive Orders & Payment</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Review incoming purchase orders from FPOs or Buyers in <strong>Incoming Orders</strong>. Approve contracts and coordinate pickup with AgriConnect logistics partners.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fpo' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">FPO Aggregation & Member Management</h3>
                <p className="text-xs text-slate-500 mt-1">Empowering Farmer Producer Organizations to aggregate volume and command premium institutional rates.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-sm text-slate-900">Pool Farmer Lots</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Go to <strong>Inventory</strong>. Click <strong>Pool Commodity</strong> to record member farmer contributions, specifying crop grade, pooled volume in quintals/tons, and storage location.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-sm text-slate-900">Procure from Members</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Create internal procurement campaigns specifying minimum support pricing (MSP), required tonnage, and delivery dates to buy directly from local farmers.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="font-bold text-sm text-slate-900">Fulfill Institutional Demands</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Review high-volume purchase requests posted by retail chains and food processors. Fulfill orders in bulk and disburse farmer payments automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buyer' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Institutional Buyer Procurement Guide</h3>
                <p className="text-xs text-slate-500 mt-1">Source verified agricultural commodities directly with farm-gate traceability.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-700 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-sm text-slate-900">Post Sourcing Demand</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Use <strong>Post Demand</strong> to specify your exact requirements: crop variety, required tonnage, target price per unit, delivery city, and required delivery date.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-700 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-sm text-slate-900">Browse Direct Marketplace</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Search active produce lots listed by verified farmers and FPOs. Filter by location, price, and harvest date. Inspect crop photos and quality certificates.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-700 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="font-bold text-sm text-slate-900">Instant Purchase Order</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Submit a binding purchase order. The seller receives immediate notification and inventory is reserved automatically, preventing double-selling.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logistics' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Logistics & Fleet Operator Guide</h3>
                <p className="text-xs text-slate-500 mt-1">Maximize fleet utilization with crop transit matching and payload tracking.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-700 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-sm text-slate-900">Register Vehicles</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    In <strong>Fleet Management</strong>, register trucks by entering registration plate, gross payload capacity in tons, price per km/ton, and operating corridor cities.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-700 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-sm text-slate-900">Update Available Payload</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Adjust remaining load capacity in real time. If a 10-ton truck is carrying 4 tons of tomatoes, set available capacity to 6 tons to pick up partial consolidation cargo along the route.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-700 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="font-bold text-sm text-slate-900">Dispatch & Status Updates</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Update shipment milestones: <em>Pickup Scheduled</em>, <em>Picked Up</em>, <em>In Transit</em>, and <em>Delivered</em>. Payments settle upon delivery confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Multilingual Voice AI Assistant</h3>
                <p className="text-xs text-slate-500 mt-1">Voice-enabled agricultural intelligence powered by Google Gemini and Speech-to-Text.</p>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-3">
                <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-rose-600" /> How to use the Voice Assistant
                </h4>
                <ul className="text-xs text-rose-900 space-y-2 list-disc list-inside">
                  <li>Click the floating microphone pill at the bottom right corner of any page.</li>
                  <li>Speak naturally in <strong>English, Hindi, Kannada, Tamil, or Telugu</strong>.</li>
                  <li>Ask questions like: <em>"What is the current market rate for onions in Mysuru APMC?"</em></li>
                  <li>Ask: <em>"How do I add a new harvest lot of 50 bags of paddy?"</em></li>
                  <li>The AI assistant understands agricultural terminology, crop diseases, fertilizer recommendations, and platform navigation.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Quick Help Footer Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Still have questions?</h4>
            <p className="text-xs text-slate-500">Read our frequently asked questions or speak directly with our team.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/faq"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
            >
              Browse FAQ
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;

