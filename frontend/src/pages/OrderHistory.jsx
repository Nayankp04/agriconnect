import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchOrders } from '../services/orderService';
import Breadcrumbs from '../components/Breadcrumbs';
import Loading from '../components/Loading';
import {
  Package,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full">Pending</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-full">Accepted</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold text-[11px] rounded-full">In Transit</span>;
      case 'COMPLETED':
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full">Completed</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-[11px] rounded-full">{status}</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-[11px] rounded-full">{status}</span>;
    }
  };

  const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const completedCount = orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Order History', active: true }]} />

        {/* Top Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Order History & Invoices</h1>
              <p className="text-xs text-slate-500">Track purchase orders, fulfillment statuses, and trade settlements</p>
            </div>
          </div>

          <Link
            to="/marketplace"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Browse Marketplace
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{completedCount} fulfilled orders</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Action</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting acceptance/shipment</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transacted Volume</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalValue.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Gross order value</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Acceptance</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <Loading text="Loading order records..." />
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isBuyer = user?._id === order.buyer?._id;
              const otherParty = isBuyer ? order.seller : order.buyer;
              return (
                <div
                  key={order._id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        #{order.orderNumber || order._id.slice(-6)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {order.cropName} &bull; {order.quantity} {order.unit}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isBuyer ? 'Purchased from' : 'Sold to'}: <strong>{otherParty?.name || 'Verified Trader'}</strong> &bull; {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Amount</span>
                      <strong className="text-base font-black text-emerald-700">₹{order.totalAmount.toLocaleString('en-IN')}</strong>
                    </div>

                    <Link
                      to={`/orders/${order._id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No orders found</h3>
            <p>You have not placed or received any orders matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

