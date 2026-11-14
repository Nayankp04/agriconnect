import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2 text-white font-extrabold text-lg">
            <Sprout className="w-6 h-6 text-emerald-500" />
            <span>AgriConnect</span>
          </Link>
          <p className="text-slate-400 leading-relaxed">
            Eliminating unnecessary middlemen and creating direct transparent linkages between Farmers, FPOs, Large Bulk Buyers, and Logistics Partners across Karnataka and India.
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> 100% Verified Farm-Gate Traceability
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Supply Chain Directory</h4>
          <ul className="space-y-2">
            <li><Link to="/marketplace" className="hover:text-emerald-400 transition-colors">Direct Crop Marketplace</Link></li>
            <li><Link to="/search?type=procurement" className="hover:text-emerald-400 transition-colors">Institutional Buyer Demands</Link></li>
            <li><Link to="/search?type=vehicles" className="hover:text-emerald-400 transition-colors">Logistics Transport Fleet</Link></li>
            <li><Link to="/orders" className="hover:text-emerald-400 transition-colors">Order History & Invoices</Link></li>
            <li><Link to="/assistant" className="hover:text-emerald-400 transition-colors">Gnani Voice AI Assistant</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Resources & Support</h4>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About AgriConnect</Link></li>
            <li><Link to="/help" className="hover:text-emerald-400 transition-colors">User Guides & Tutorials</Link></li>
            <li><Link to="/faq" className="hover:text-emerald-400 transition-colors">Frequently Asked Questions</Link></li>
            <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support & Offices</Link></li>
            <li><Link to="/search" className="hover:text-emerald-400 transition-colors">Global Search Catalog</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm mb-1">Helpline & Hubs</h4>
          <p className="flex items-center gap-2 text-slate-300 font-bold">
            <Phone className="w-4 h-4 text-emerald-500 shrink-0" /> +91 1800-425-AGRI (2474)
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-500 shrink-0" /> support@agriconnect.in
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Mysuru & Bengaluru, Karnataka
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between text-slate-500 gap-4">
        <p className="text-center md:text-left">
          &copy; 2026 AgriConnect Platform. Empowering sustainable Indian agriculture.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-[11px]">
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <span>&bull;</span>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <span>&bull;</span>
          <Link to="/cookies" className="hover:text-slate-300 transition-colors">Cookie Policy</Link>
          <span>&bull;</span>
          <Link to="/contact" className="hover:text-slate-300 transition-colors">APMC Inquiries</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
