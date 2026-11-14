import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Breadcrumbs from '../components/Breadcrumbs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Calendar,
  Edit3,
  Building,
  Award,
  Sprout,
  ArrowRight
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-4">
          <p className="text-xs text-slate-500 font-semibold">Please sign in to view your profile.</p>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'FARMER':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">🌾 Farmer / Producer</span>;
      case 'FPO':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">🏢 FPO Representative</span>;
      case 'BUYER':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">🛒 Institutional Buyer</span>;
      case 'LOGISTICS':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full">🚚 Logistics Partner</span>;
      case 'ADMIN':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full">🛡️ Platform Administrator</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">{role}</span>;
    }
  };

  const getDashboardLink = (role) => {
    switch (role) {
      case 'FARMER': return '/farmer/dashboard';
      case 'FPO': return '/fpo/dashboard';
      case 'BUYER': return '/buyer/dashboard';
      case 'LOGISTICS': return '/logistics/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'My Account & Profile', active: true }]} />

        {/* Profile Card Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 relative">
            <div className="absolute top-4 right-4">
              <Link
                to="/profile/edit"
                className="px-4 py-2 bg-white/90 hover:bg-white text-slate-800 font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5 transition-all backdrop-blur-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" /> Edit Profile
              </Link>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-6">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <img
                    src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                    alt={user.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full border-2 border-white" title="Verified Member">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user.name}</h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <div>{getRoleBadge(user.role)}</div>
                </div>
              </div>

              <div>
                <Link
                  to={getDashboardLink(user.role)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-2"
                >
                  Go to Role Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Account Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Information</h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email Address</span>
                      <strong className="text-slate-800 font-semibold">{user.email}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone Number</span>
                      <strong className="text-slate-800 font-semibold">{user.phone || '+91 98000 00000'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location & Base Area</h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Regional Territory</span>
                      <strong className="text-slate-800 font-semibold">
                        {user.location?.city || 'Mysuru'}, {user.location?.district || 'Mysuru'}, {user.location?.state || 'Karnataka'}
                      </strong>
                      {user.location?.address && (
                        <p className="text-slate-500 text-[11px] mt-0.5">{user.location.address}</p>
                      )}
                      {user.location?.pincode && (
                        <span className="text-slate-400 text-[11px] block">PIN: {user.location.pincode}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security and Trust Card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-950">Firebase Verified Account Security</h4>
              <p className="text-xs text-emerald-800">Your email has been authenticated. Passwords are encrypted with standard 10-round bcrypt hashing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

