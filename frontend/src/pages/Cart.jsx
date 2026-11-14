import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createOrder } from '../services/orderService';
import Breadcrumbs from '../components/Breadcrumbs';
import {
  ShoppingCart,
  Trash2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sprout,
  AlertCircle,
  CheckCircle2,
  Truck
} from 'lucide-react';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState({
    city: 'Mysuru',
    district: 'Mysuru',
    state: 'Karnataka',
    address: '',
    pincode: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load pending cart from localStorage if present
    const saved = localStorage.getItem('agriconnect_cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        setCartItems([]);
      }
    }

    if (user?.location) {
      setDeliveryAddress({
        city: user.location.city || 'Mysuru',
        district: user.location.district || 'Mysuru',
        state: user.location.state || 'Karnataka',
        address: user.location.address || '',
        pincode: user.location.pincode || '',
      });
    }
  }, [user]);

  const updateQuantity = (idx, newQty) => {
    const updated = [...cartItems];
    const item = updated[idx];
    const qty = Math.max(1, Number(newQty));
    if (item.availableQuantity && qty > item.availableQuantity) {
      alert(`Cannot exceed available stock of ${item.availableQuantity} ${item.unit}`);
      return;
    }
    item.quantity = qty;
    setCartItems(updated);
    localStorage.setItem('agriconnect_cart', JSON.stringify(updated));
  };

  const removeItem = (idx) => {
    const updated = cartItems.filter((_, i) => i !== idx);
    setCartItems(updated);
    localStorage.setItem('agriconnect_cart', JSON.stringify(updated));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('agriconnect_cart');
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.pricePerUnit) || 0),
    0
  );

  const estimatedFreight = subtotal > 0 ? 350 : 0;
  const platformFee = 0; // Transparent zero-commission model
  const grandTotal = subtotal + estimatedFreight + platformFee;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setError('');
    setSubmitting(true);

    try {
      // Place orders for each cart item
      const createdOrders = [];
      for (const item of cartItems) {
        const payload = {
          sellerId: item.sellerId || item.seller?._id,
          produceId: item.produceId || item._id,
          cropName: item.cropName || item.name,
          quantity: Number(item.quantity),
          unit: item.unit || 'kg',
          pricePerUnit: Number(item.pricePerUnit),
          orderType: user?.role === 'BUYER' ? 'BUYER_FARMER' : 'FPO_FARMER',
          deliveryAddress,
        };

        const res = await createOrder(payload);
        if (res.success) {
          createdOrders.push(res.data);
        }
      }

      clearCart();
      setSuccess(true);
      setTimeout(() => {
        if (createdOrders.length > 0) {
          navigate(`/orders/${createdOrders[0]._id}`);
        } else {
          navigate('/orders');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to place purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Marketplace', path: '/marketplace' },
            { label: 'Purchase Request Checkout', active: true },
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Purchase Request & Checkout</h1>
              <p className="text-xs text-slate-500">Review selected produce lots and confirm delivery details</p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            Order placed successfully! Stock has been reserved. Redirecting to order details...
          </div>
        )}

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=300&q=60'}
                      alt={item.name || item.cropName}
                      className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-100"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.name || item.cropName}</h3>
                      <p className="text-xs text-slate-500">
                        Seller: {item.sellerName || 'Verified Producer'} &bull; {item.location?.city || 'Mysuru'}
                      </p>
                      <span className="text-xs font-black text-emerald-700 block mt-1">
                        ₹{item.pricePerUnit} / {item.unit || 'kg'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-400">Qty ({item.unit}):</label>
                      <input
                        type="number"
                        min="1"
                        max={item.availableQuantity || 99999}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(idx, e.target.value)}
                        className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div className="text-right min-w-[80px]">
                      <span className="text-xs font-black text-slate-900">
                        ₹{((Number(item.quantity) || 1) * (Number(item.pricePerUnit) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Delivery Address Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Delivery & Destination Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">District</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.district}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, district: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Delivery Address / Warehouse</label>
                  <input
                    type="text"
                    required
                    placeholder="Warehouse / Shop / Delivery Location"
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Price Summary Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                Order Value Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Commodity Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-purple-600" /> Estimated Transit:
                  </span>
                  <span className="font-semibold text-slate-900">₹{estimatedFreight}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Direct Farm Gate Margin:</span>
                  <span className="font-semibold text-emerald-700">0% Commission</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                  <span className="font-black text-slate-900">Grand Total:</span>
                  <span className="font-black text-lg text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Automatic Stock Reservation
                </div>
                <p>Upon order placement, stock is deducted from the seller's live inventory and held in escrow.</p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Placing Orders...' : (
                  <>
                    Confirm Purchase Request <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <ShoppingCart className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-900">Your Purchase Cart is Empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Explore available produce lots listed directly by farmers and FPOs on our agricultural marketplace.
            </p>
            <div className="pt-2">
              <Link
                to="/marketplace"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2"
              >
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

