import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchOrderById, updateOrderStatus } from '../services/orderService';
import Breadcrumbs from '../components/Breadcrumbs';
import Loading from '../components/Loading';
import {
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  ShieldCheck,
  Truck,
  ArrowLeft,
  XCircle,
  FileText,
  Printer
} from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await fetchOrderById(id);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
    setUpdating(true);
    try {
      const res = await updateOrderStatus(id, { status: newStatus });
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <Loading text="Loading order details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'Unable to retrieve order details.'}</p>
          <Link
            to="/orders"
            className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const isSeller = user?._id === order.seller?._id;
  const isBuyer = user?._id === order.buyer?._id;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">Pending Acceptance</span>;
      case 'ACCEPTED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">Order Accepted</span>;
      case 'IN_TRANSIT':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full">In Transit</span>;
      case 'COMPLETED':
      case 'DELIVERED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">Completed / Delivered</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full">{status}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">{status}</span>;
    }
  };

  const steps = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED'];
  const currentStepIdx = steps.indexOf(order.status) !== -1 ? steps.indexOf(order.status) : (order.status === 'DELIVERED' ? 3 : -1);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Orders', path: '/orders' },
            { label: `Order #${order.orderNumber || order._id.slice(-6)}`, active: true },
          ]}
        />

        {/* Top Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                #{order.orderNumber || order._id}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-2">
              Purchase Order: {order.cropName} ({order.quantity} {order.unit})
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
          </div>
        </div>

        {/* Lifecycle Stepper (if not rejected/cancelled) */}
        {!['REJECTED', 'CANCELLED'].includes(order.status) && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              Fulfillment & Settlement Timeline
            </h3>
            <div className="grid grid-cols-4 gap-2 relative">
              {steps.map((st, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={st} className="text-center space-y-2">
                    <div
                      className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] block font-bold uppercase tracking-wider ${
                        isCurrent
                          ? 'text-emerald-700 font-black'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Produce & Financials */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Commodity & Pricing
            </h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Crop / Product:</span>
                <strong className="text-slate-900">{order.cropName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Quantity:</span>
                <strong className="text-slate-900">{order.quantity} {order.unit}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price per Unit:</span>
                <strong className="text-slate-900">₹{order.pricePerUnit} / {order.unit}</strong>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Total Settlement Value:</span>
                <span className="font-black text-emerald-700 text-base">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
              <span className="font-semibold">Payment Status:</span>
              <span className="font-bold uppercase tracking-wider">{order.paymentStatus || 'PENDING'}</span>
            </div>
          </div>

          {/* Stakeholders Contact */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trading Stakeholders
            </h3>

            <div className="space-y-3 text-xs">
              {/* Buyer */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Buyer Party</span>
                <div className="font-bold text-slate-900">{order.buyer?.name || 'Verified Buyer'}</div>
                <div className="text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {order.buyer?.phone || 'N/A'}
                </div>
              </div>

              {/* Seller */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Seller / Origin Farm</span>
                <div className="font-bold text-slate-900">{order.seller?.name || 'Verified Producer'}</div>
                <div className="text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {order.seller?.phone || 'N/A'}
                </div>
              </div>
            </div>

            {/* Delivery Destination */}
            {order.deliveryAddress && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Delivery Destination</strong>
                  <span>{order.deliveryAddress.address || 'APMC Yard'}, {order.deliveryAddress.city || 'Mysuru'}, {order.deliveryAddress.state || 'Karnataka'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/orders"
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>

          <div className="flex gap-2">
            {isSeller && order.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleStatusChange('REJECTED')}
                  disabled={updating}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                >
                  Decline Order
                </button>
                <button
                  onClick={() => handleStatusChange('ACCEPTED')}
                  disabled={updating}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  Accept Order
                </button>
              </>
            )}

            {order.status === 'ACCEPTED' && (
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={updating}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                Mark as Completed / Delivered
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

