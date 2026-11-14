import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  MessageCircle,
  PhoneCall,
  Sprout,
  ShieldCheck,
  Truck
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const FAQ_DATA = [
  {
    category: 'Inventory & Produce',
    question: 'What units of measurement can I use when adding agricultural produce?',
    answer:
      'AgriConnect supports industry-standard agricultural units: Kilograms (kg), Quintals (100 kg), Metric Tons (1000 kg), Litres (for dairy/oils/liquid organic inputs), Bags (50 kg / standard gunny bag), and Individual Pieces (for large fruits like watermelon, papaya, coconut). You can select your preferred unit from the dropdown when listing or demanding produce.'
  },
  {
    category: 'Inventory & Produce',
    question: 'How does inventory stock deduction work when an order is placed?',
    answer:
      'When a buyer places a purchase order, the requested quantity is automatically reserved from the seller\'s available stock to prevent double-selling. If the seller or buyer cancels or rejects the order, the reserved quantity is instantly restored to the available pool. Sellers can also manually adjust their stock at any time using the "Adjust Stock" button.'
  },
  {
    category: 'Orders & Payments',
    question: 'How are payments processed between Buyers, Farmers, and FPOs?',
    answer:
      'AgriConnect supports digital escrow settlement and verified milestone invoicing. Upon mutual order acceptance and logistics verification, funds are disbursed directly into the seller\'s linked bank account or FPO cooperative ledger, eliminating third-party agent deductions.'
  },
  {
    category: 'Orders & Payments',
    question: 'Can an FPO sell produce directly to institutional buyers?',
    answer:
      'Yes! FPOs can aggregate produce from their registered member farmers into pooled inventory lots and negotiate bulk procurement contracts directly with supermarket chains, exporters, and food processors.'
  },
  {
    category: 'Logistics & Transport',
    question: 'How do Logistics Partners coordinate cargo pickups?',
    answer:
      'Logistics partners register their fleet vehicles with specific payload capacities (in tons) and set their per-kilometer or per-ton rates. When an order is finalized, a shipment request is dispatched matching the origin, destination, and payload requirements.'
  },
  {
    category: 'Logistics & Transport',
    question: 'What happens if a vehicle has partial capacity remaining?',
    answer:
      'Logistics operators can update their "Available Capacity" in tons at any time. For instance, if a 10-ton container truck is transporting 6 tons of grain, the operator can advertise the remaining 4 tons to pickup additional cargo along the route, maximizing earnings.'
  },
  {
    category: 'Account & Security',
    question: 'How does email verification work during registration?',
    answer:
      'AgriConnect uses Firebase Authentication for secure email verification. When you register, a verification email is sent to your address. Clicking the link verifies your identity and activates your AgriConnect role profile in MongoDB, protecting the community from spam and fraudulent listings.'
  },
  {
    category: 'Account & Security',
    question: 'Can I switch between different roles or test as another user?',
    answer:
      'On demo deployments, you can use the quick role switcher in the navigation bar to test as a Farmer, FPO, Buyer, or Logistics Partner. In production, each user account is tied to their verified role and credentials.'
  },
  {
    category: 'Voice AI Assistant',
    question: 'How does the Voice Assistant understand regional languages?',
    answer:
      'Our Voice Assistant integrates Google Gemini multimodal models with high-accuracy speech recognition. It supports conversational queries in English, Hindi, Kannada, and other regional languages to give real-time APMC price checks, crop advice, and platform assistance.'
  }
];

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openIndex, setOpenIndex] = useState(null);

  const categories = ['ALL', 'Inventory & Produce', 'Orders & Payments', 'Logistics & Transport', 'Account & Security', 'Voice AI Assistant'];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Frequently Asked Questions', active: true }]} />

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" /> Instant Answers
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Frequently Asked Questions</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Find quick solutions to common questions regarding trading, inventory management, transport dispatch, and account settings.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keywords (e.g. units, payment, stock, logistics)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        {faq.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
              No matching questions found. Try refining your search query.
            </div>
          )}
        </div>

        {/* Still Need Help Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-emerald-950">Did not find what you were looking for?</h4>
            <p className="text-xs text-emerald-800">Our customer support specialists are ready to assist you directly.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/contact"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

