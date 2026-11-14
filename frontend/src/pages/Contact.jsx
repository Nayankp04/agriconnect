import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'FARMER',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'FARMER',
        subject: '',
        message: '',
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Contact Us', active: true }]} />

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Get in Touch</span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">We're Here to Support Your Agri-Journey</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Have questions about produce listing, FPO aggregation, institutional bulk buying, or logistics integration? Our team is available 6 days a week.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="space-y-6">
            <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-lg space-y-6">
              <h3 className="text-lg font-black">Support & Help Desk</h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Connect directly with our dedicated agrarian advisors and technical assistance teams.
              </p>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Toll-Free Helpline</span>
                    <span className="text-emerald-200">+91 1800-425-AGRI (2474)</span>
                    <span className="text-[11px] text-emerald-300 block">Mon - Sat: 8:00 AM - 8:00 PM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Direct Email</span>
                    <span className="text-emerald-200">support@agriconnect.in</span>
                    <span className="text-emerald-200">fpo-desk@agriconnect.in</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Operating Hours</span>
                    <span className="text-emerald-200">Monday - Saturday</span>
                    <span className="text-[11px] text-emerald-300 block">Emergency logistics dispatch 24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Offices */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Regional Centers
              </h4>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="border-l-2 border-emerald-500 pl-3">
                  <strong className="text-slate-800 block">Mysuru Regional Office</strong>
                  <p>APMC Yard Complex, Bandipalya, Mysuru, Karnataka 570025</p>
                </div>
                <div className="border-l-2 border-slate-300 pl-3">
                  <strong className="text-slate-800 block">Bengaluru Tech Hub</strong>
                  <p>Brigade Tech Gardens, Whitefield, Bengaluru, Karnataka 560066</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            {submitted ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Message Received!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Thank you for reaching out to AgriConnect. A regional representative will contact you within 24 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-emerald-600" /> Send an Inquiry
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patil"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Stakeholder Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="FARMER">Farmer / Producer</option>
                      <option value="FPO">Farmer Producer Organization (FPO)</option>
                      <option value="BUYER">Wholesale / Retail Institutional Buyer</option>
                      <option value="LOGISTICS">Logistics & Fleet Operator</option>
                      <option value="OTHER">Government / NGO / Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bulk Wheat Procurement Query"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your requirements, crop specifications, or partnership question..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting...' : (
                    <>
                      <Send className="w-4 h-4" /> Submit Inquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

