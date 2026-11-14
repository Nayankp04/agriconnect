import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Loading from '../components/Loading';
import {
  Search,
  Filter,
  Sprout,
  Building2,
  Truck,
  MapPin,
  Calendar,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = searchParams.get('type') || 'produce';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialTab); // 'produce', 'procurement', 'vehicles'
  const [loading, setLoading] = useState(false);

  const [produces, setProduces] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'priceAsc', 'priceDesc'

  const executeSearch = async () => {
    setLoading(true);
    try {
      if (activeTab === 'produce') {
        const res = await API.get(`/produce?search=${encodeURIComponent(searchTerm)}`);
        if (res.data.success) setProduces(res.data.data);
      } else if (activeTab === 'procurement') {
        const res = await API.get('/procurement');
        if (res.data.success) {
          const list = res.data.data || [];
          setProcurements(
            searchTerm
              ? list.filter(
                  (p) =>
                    p.cropName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.deliveryLocation?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : list
          );
        }
      } else if (activeTab === 'vehicles') {
        const res = await API.get('/logistics/vehicles');
        if (res.data.success) {
          const list = res.data.data || [];
          setVehicles(
            searchTerm
              ? list.filter(
                  (v) =>
                    v.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    v.currentCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    v.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : list
          );
        }
      }
    } catch (err) {
      console.error('Search query failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [activeTab, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm, type: activeTab });
    executeSearch();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ q: searchTerm, type: tab });
  };

  // Filter & Sort Produce
  const filteredProduces = produces
    .filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchPrice = !maxPrice || p.pricePerUnit <= Number(maxPrice);
      return matchCat && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return a.pricePerUnit - b.pricePerUnit;
      if (sortBy === 'priceDesc') return b.pricePerUnit - a.pricePerUnit;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Marketplace', path: '/marketplace' },
            { label: 'Global Search', active: true },
          ]}
        />

        {/* Search Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">AgriConnect Global Search</h1>
            <p className="text-xs text-slate-500 mt-1">
              Find crops, buyer requirements, and transport capacity across regional APMC hubs
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search crops, varieties, buyers, locations, or vehicle types..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow transition-all"
            >
              Search
            </button>
          </form>

          {/* Type Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleTabChange('produce')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'produce'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sprout className="w-4 h-4" /> Produce Lots
            </button>
            <button
              onClick={() => handleTabChange('procurement')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'procurement'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" /> Buyer Demands
            </button>
            <button
              onClick={() => handleTabChange('vehicles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'vehicles'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" /> Transport & Fleet
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Produce Specific) */}
        {activeTab === 'produce' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="ALL">All Categories</option>
                <option value="GRAINS">Grains & Cereals</option>
                <option value="PULSES">Pulses & Legumes</option>
                <option value="VEGETABLES">Vegetables</option>
                <option value="FRUITS">Fruits</option>
                <option value="SPICES">Spices & Condiments</option>
                <option value="OILSEEDS">Oilseeds</option>
                <option value="COMMERCIAL">Commercial Crops</option>
              </select>

              <input
                type="number"
                placeholder="Max Price (₹)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="newest">Newest First</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <Loading text="Searching records..." />
        ) : (
          <div>
            {activeTab === 'produce' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProduces.length > 0 ? (
                  filteredProduces.map((p) => (
                    <div
                      key={p._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="h-44 bg-slate-100 relative overflow-hidden">
                        {p.images && p.images.length > 0 ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=60';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Sprout className="w-12 h-12" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-emerald-900 uppercase">
                          {p.category || 'General'}
                        </span>
                      </div>

                      <div className="p-5 space-y-3 flex-1">
                        <div>
                          <h3 className="text-base font-black text-slate-900">{p.name}</h3>
                          <span className="text-xs text-slate-500">{p.variety || 'Standard Quality'}</span>
                        </div>

                        <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Available Stock</span>
                            <strong className="text-slate-900 font-black">
                              {p.availableQuantity} {p.unit}
                            </strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Price</span>
                            <strong className="text-emerald-700 font-black text-sm">
                              ₹{p.pricePerUnit} <span className="text-[10px] font-normal text-slate-500">/ {p.unit}</span>
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.location?.city || 'Mysuru'}, {p.location?.state || 'Karnataka'}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Link
                          to={`/produce/${p._id}`}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-1.5"
                        >
                          View Produce Lot <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                    No produce listings match your search.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'procurement' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {procurements.length > 0 ? (
                  procurements.map((req) => (
                    <div
                      key={req._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full uppercase">
                            Demand Posting
                          </span>
                          <span className="text-xs text-slate-400">
                            {req.requiredDeliveryDate ? new Date(req.requiredDeliveryDate).toLocaleDateString() : 'Immediate'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-2">{req.cropName}</h3>
                        <p className="text-xs text-slate-500">Required: <strong>{req.quantity} {req.unit || 'Quintals'}</strong></p>
                      </div>

                      <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 flex justify-between text-xs">
                        <span className="text-slate-600">Target Budget:</span>
                        <strong className="text-amber-900 font-black">₹{req.targetPricePerUnit} / {req.unit || 'unit'}</strong>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Deliver to: {req.deliveryLocation || 'Mysuru APMC'}</span>
                      </div>

                      <Link
                        to={`/procurement/${req._id}`}
                        className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow transition-all text-center"
                      >
                        Fulfill Demand Request
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                    No buyer procurement requests found matching your query.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.length > 0 ? (
                  vehicles.map((v) => (
                    <div
                      key={v._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {v.registrationNumber}
                          </span>
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold text-[10px] rounded-full">
                            {v.status || 'AVAILABLE'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-2">{v.vehicleType}</h3>
                      </div>

                      <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Available Payload:</span>
                          <strong className="text-purple-900 font-bold">{v.availableCapacityTons ?? v.capacityTons} Tons</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Freight Rate:</span>
                          <strong className="text-purple-900 font-bold">₹{v.pricePerKm} / km</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Base City: {v.currentCity || 'Mysuru'}</span>
                      </div>

                      <Link
                        to="/logistics/vehicles"
                        className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition-all text-center"
                      >
                        Book Freight Transit
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                    No fleet vehicles found matching your query.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

