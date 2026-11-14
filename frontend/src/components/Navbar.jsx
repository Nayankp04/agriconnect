import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';
import {
  Sprout,
  LogOut,
  User,
  LayoutDashboard,
  ShoppingBag,
  ChevronDown,
  Sparkles,
  Mic,
  Bell,
  ShoppingCart,
  Search,
  Menu,
  X,
  Package,
  HelpCircle
} from 'lucide-react';

const Navbar = ({ onOpenVoiceAssistant }) => {
  const { user, logout, switchDemoRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const demoAccounts = [
    { label: 'Farmer (Ramesh)', email: 'farmer@agriconnect.com', role: 'FARMER', icon: '🌾' },
    { label: 'FPO (Mysuru FPO)', email: 'fpo@agriconnect.com', role: 'FPO', icon: '🏢' },
    { label: 'Buyer (FreshToHome)', email: 'buyer@agriconnect.com', role: 'BUYER', icon: '🛒' },
    { label: 'Logistics (GreenExpress)', email: 'logistics@agriconnect.com', role: 'LOGISTICS', icon: '🚚' },
    { label: 'System Admin', email: 'admin@agriconnect.com', role: 'ADMIN', icon: '🛡️' },
  ];

  // Load unread notification count
  useEffect(() => {
    if (isAuthenticated) {
      API.get('/notifications')
        .then((res) => {
          if (res.data.success) {
            const unread = res.data.data.filter((n) => !n.isRead).length;
            setUnreadNotifications(unread);
          }
        })
        .catch(() => {});
    }

    // Check cart count
    try {
      const saved = localStorage.getItem('agriconnect_cart');
      if (saved) {
        const items = JSON.parse(saved);
        setCartCount(Array.isArray(items) ? items.length : 0);
      }
    } catch (e) {}
  }, [isAuthenticated]);

  const handleRoleSwitch = async (email) => {
    try {
      await switchDemoRole(email);
      setShowRoleMenu(false);
      setMobileMenuOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Role switch failed:', err.message);
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'FARMER': return '/farmer/dashboard';
      case 'FPO': return '/fpo/dashboard';
      case 'BUYER': return '/buyer/dashboard';
      case 'LOGISTICS': return '/logistics/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:rotate-6 group-hover:scale-105 transition-all duration-300">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                Agri<span className="text-emerald-600">Connect</span>
              </span>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest -mt-1">
                Direct Farm to Market Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-extrabold text-slate-600">
            <Link to="/" className="px-3 py-1.5 hover:text-emerald-700 hover:bg-slate-100/70 rounded-xl transition-all">
              Home
            </Link>
            <Link
              to="/marketplace"
              className="px-3 py-1.5 hover:text-emerald-700 hover:bg-slate-100/70 rounded-xl transition-all flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Marketplace
            </Link>
            <Link
              to="/search"
              className="px-3 py-1.5 hover:text-emerald-700 hover:bg-slate-100/70 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-slate-400" />
              Search
            </Link>
            <button
              onClick={onOpenVoiceAssistant}
              className="px-3 py-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all flex items-center gap-1.5 font-bold shadow-xs active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Voice AI</span>
              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase">Gnani</span>
            </button>
            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                className="px-3.5 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl hover:bg-emerald-100 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Action Items & Demo Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                <span className="hidden sm:inline">Switch Role</span>
                <span className="sm:hidden">Role</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-fade-in divide-y divide-slate-100">
                  <div className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Instant Demo Login Switcher
                  </div>
                  <div className="py-1">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => handleRoleSwitch(acc.email)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                          user?.email === acc.email ? 'bg-emerald-100/70 text-emerald-900 border-l-4 border-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{acc.icon}</span>
                          <span>{acc.label}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-extrabold text-slate-600">{acc.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors relative"
              title="Cart & Purchase Requests"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications Icon (Authenticated) */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Auth Buttons / User Profile */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 pl-2 pr-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                  title="My Profile"
                >
                  <img
                    src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                    }}
                  />
                  <span className="text-xs font-bold text-slate-800 max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-fade-in">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800"
            >
              Home
            </Link>
            <Link
              to="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800"
            >
              Marketplace
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800"
            >
              Global Search
            </Link>
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800"
            >
              My Orders
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenVoiceAssistant();
              }}
              className="w-full py-2.5 px-4 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-200"
            >
              <Mic className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Talk to Gnani Voice Assistant</span>
            </button>
          </div>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to {user.role} Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-4 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" /> View Profile & Account
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2 px-4 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold text-white bg-emerald-700 rounded-xl shadow"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
