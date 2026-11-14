import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Core Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import HelpSupport from './pages/HelpSupport';
import FAQ from './pages/FAQ';

// Auth & Profile
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

// Marketplace & Commerce
import Marketplace from './pages/marketplace/Marketplace';
import ProduceDetails from './pages/marketplace/ProduceDetails';
import ProcurementDetails from './pages/marketplace/ProcurementDetails';
import SearchResults from './pages/SearchResults';
import Cart from './pages/Cart';
import OrderDetails from './pages/OrderDetails';
import OrderHistory from './pages/OrderHistory';
import NotificationsPage from './pages/NotificationsPage';

// Role Dashboards & Workflows
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import AddProduce from './pages/farmer/AddProduce';
import MyProduce from './pages/farmer/MyProduce';
import FarmerOrders from './pages/farmer/FarmerOrders';

import FPODashboard from './pages/fpo/FPODashboard';
import Procurement from './pages/fpo/Procurement';
import Inventory from './pages/fpo/Inventory';
import FPOOrders from './pages/fpo/FPOOrders';

import BuyerDashboard from './pages/buyer/BuyerDashboard';
import CreateDemand from './pages/buyer/CreateDemand';
import BuyerOrders from './pages/buyer/BuyerOrders';

import LogisticsDashboard from './pages/logistics/LogisticsDashboard';
import VehicleManagement from './pages/logistics/VehicleManagement';
import Shipments from './pages/logistics/Shipments';

import AdminDashboard from './pages/admin/AdminDashboard';
import Messages from './pages/Messages';
import AssistantPage from './pages/assistant/AssistantPage';

// Legal Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsConditions from './pages/legal/TermsConditions';
import CookiePolicy from './pages/legal/CookiePolicy';

// Error Pages
import NotFound from './pages/errors/NotFound';
import AccessDenied from './pages/errors/AccessDenied';
import ServerError from './pages/errors/ServerError';
import Maintenance from './pages/errors/Maintenance';
import NetworkError from './pages/errors/NetworkError';

// Voice Assistant Components
import FloatingVoiceButton from './components/voice/FloatingVoiceButton';
import VoiceAssistantDrawer from './components/voice/VoiceAssistantDrawer';

const RoleDashboardRedirect = () => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'FARMER': return <Navigate to="/farmer/dashboard" replace />;
    case 'FPO': return <Navigate to="/fpo/dashboard" replace />;
    case 'BUYER': return <Navigate to="/buyer/dashboard" replace />;
    case 'LOGISTICS': return <Navigate to="/logistics/dashboard" replace />;
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    default: return <Navigate to="/" replace />;
  }
};

function App() {
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = React.useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 relative">
          <Navbar onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)} />
          <div className="flex-1">
            <Routes>
              {/* Public & Informational Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<HelpSupport />} />
              <Route path="/faq" element={<FAQ />} />

              {/* Authentication & Profile Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />

              {/* Commerce, Search & Activities */}
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Voice AI Assistant */}
              <Route path="/assistant" element={<AssistantPage />} />

              {/* Product Details */}
              <Route path="/produce/:id" element={<ProduceDetails />} />
              <Route path="/procurement/:id" element={<ProcurementDetails />} />
              <Route path="/dashboard" element={<RoleDashboardRedirect />} />

              {/* Farmer Routes */}
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/add-produce" element={<AddProduce />} />
              <Route path="/farmer/produce" element={<MyProduce />} />
              <Route path="/farmer/orders" element={<FarmerOrders />} />

              {/* FPO Routes */}
              <Route path="/fpo/dashboard" element={<FPODashboard />} />
              <Route path="/fpo/procurement" element={<Procurement />} />
              <Route path="/fpo/inventory" element={<Inventory />} />
              <Route path="/fpo/orders" element={<FPOOrders />} />

              {/* Buyer Routes */}
              <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
              <Route path="/buyer/create-demand" element={<CreateDemand />} />
              <Route path="/buyer/orders" element={<BuyerOrders />} />

              {/* Logistics Routes */}
              <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
              <Route path="/logistics/vehicles" element={<VehicleManagement />} />
              <Route path="/logistics/shipments" element={<Shipments />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Shared Communications */}
              <Route path="/messages" element={<Messages />} />

              {/* Legal Pages */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/cookies" element={<CookiePolicy />} />

              {/* System & Error Pages */}
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="/server-error" element={<ServerError />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/network-error" element={<NetworkError />} />

              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />

          {/* Global Floating AI Voice Assistant Button & Drawer */}
          <FloatingVoiceButton
            isOpen={isVoiceAssistantOpen}
            onClick={() => setIsVoiceAssistantOpen((prev) => !prev)}
          />
          <VoiceAssistantDrawer
            isOpen={isVoiceAssistantOpen}
            onClose={() => setIsVoiceAssistantOpen(false)}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
