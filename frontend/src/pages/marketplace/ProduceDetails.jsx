import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import Breadcrumbs from '../../components/Breadcrumbs';
import { fetchProduceById } from '../../services/produceService';
import { createOrder } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Award,
  User,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  Plus
} from 'lucide-react';

const ProduceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [produce, setProduce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await fetchProduceById(id);
        if (res.success) {
          const p = res.data;
          setProduce(p);
          setOrderQuantity(p.minOrderQuantity || 1);
          setOfferedPrice(p.pricePerUnit || p.expectedPrice || 25);
        }
      } catch (err) {
        console.error('Failed to load produce details:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  const handleAddToCart = () => {
    const qty = Number(orderQuantity);
    if (!qty || qty <= 0) {
      alert('Please enter a valid order quantity');
      return;
    }
    if (qty > produce.availableQuantity) {
      alert(`Requested quantity exceeds available stock (${produce.availableQuantity} ${produce.unit})`);
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem('agriconnect_cart') || '[]');
      const itemIndex = existing.findIndex((i) => (i.produceId || i._id) === produce._id);

      const cartItem = {
        produceId: produce._id,
        _id: produce._id,
        name: produce.name || produce.cropName,
        cropName: produce.name || produce.cropName,
        variety: produce.variety,
        unit: produce.unit || 'kg',
        pricePerUnit: Number(offeredPrice) || produce.pricePerUnit || produce.expectedPrice,
        quantity: qty,
        availableQuantity: produce.availableQuantity,
        sellerId: produce.farmer?._id || produce.farmer,
        sellerName: produce.farmer?.name || 'Verified Producer',
        location: produce.location,
        image: produce.images && produce.images[0] ? produce.images[0] : null,
      };

      if (itemIndex > -1) {
        existing[itemIndex] = cartItem;
      } else {
        existing.push(cartItem);
      }

      localStorage.setItem('agriconnect_cart', JSON.stringify(existing));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (e) {
      console.error('Cart error:', e);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const isFPO = user?.role === 'FPO';
      const cropTitle = produce.name || produce.cropName || 'Farm Produce';

      const res = await createOrder({
        sellerId: produce.farmer?._id || produce.farmer,
        produceId: produce._id,
        cropName: cropTitle,
        quantity: Number(orderQuantity),
        unit: produce.unit || 'kg',
        pricePerUnit: Number(offeredPrice),
        orderType: isFPO ? 'FPO_FARMER' : 'BUYER_FARMER',
        deliveryAddress: user?.location,
      });

      setSuccessMsg('Purchase order created cleanly! Available quantity locked and decremented.');
      setTimeout(() => {
        if (res.data?._id) {
          navigate(`/orders/${res.data._id}`);
        } else {
          navigate('/orders');
        }
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Order creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading crop produce details..." />;
  if (!produce) return <div className="p-8 text-center text-slate-500">Produce listing not found.</div>;

  const defaultImg = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80';
  const cropTitle = produce.name || produce.cropName || 'Agricultural Produce';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Marketplace', path: '/marketplace' },
          { label: cropTitle, active: true },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Left: Image & Map */}
        <div className="space-y-6">
          <div className="relative h-72 rounded-2xl overflow-hidden shadow-md bg-slate-100">
            <img
              src={produce.images && produce.images[0] ? produce.images[0] : defaultImg}
              alt={cropTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultImg;
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-xs font-extrabold text-slate-900 shadow">
                {produce.qualityGrade || 'Grade A'}
              </span>
              <StatusBadge status={produce.status} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Farm Location Map</h4>
            <MapView
              pickup={{ lat: 12.2958, lng: 76.6394, title: `${produce.farmer?.name || 'Farmer'}'s Farm (${produce.location?.city || 'Mysuru'})` }}
              delivery={{ lat: 12.9716, lng: 77.5946, title: 'Your Destination APMC Yard' }}
              height="220px"
            />
          </div>
        </div>

        {/* Right: Produce Info & Order Form */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{produce.variety || produce.category || 'Farm Produce'}</span>
              <h1 className="text-3xl font-black text-slate-900">{cropTitle}</h1>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                ₹{produce.pricePerUnit || produce.expectedPrice} <span className="text-sm font-normal text-slate-500">per {produce.unit || 'kg'}</span>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {produce.description || `Freshly harvested ${cropTitle} available directly from verified farmer producers in ${produce.location?.city || 'Mysuru'}.`}
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Available Stock:</span>
                <strong className="text-emerald-900 font-extrabold">{produce.availableQuantity?.toLocaleString()} {produce.unit || 'kg'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Harvested:</span>
                <span className="font-semibold">{produce.quantity?.toLocaleString()} {produce.unit || 'kg'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer / Origin:</span>
                <span className="font-bold text-slate-800">{produce.farmer?.name || 'Verified Farmer Partner'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold">{produce.location?.city || 'Mysuru'}, {produce.location?.state || 'Karnataka'}</span>
              </div>
            </div>
          </div>

          {/* Order Actions */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {addedToCart && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Added to your Cart!
                </span>
                <Link to="/cart" className="underline font-black">View Cart</Link>
              </div>
            )}

            {successMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleCreateOrder}>
                {errorMsg && <p className="text-xs text-rose-600 font-bold">{errorMsg}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Order Quantity ({produce.unit || 'kg'})</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={produce.availableQuantity}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Agreed Price (₹ / unit)</label>
                    <input
                      type="number"
                      required
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={produce.availableQuantity === 0}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Add to Cart
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || produce.availableQuantity === 0}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {submitting ? 'Placing...' : 'Direct Purchase'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProduceDetails;
