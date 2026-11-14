import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import Breadcrumbs from '../../components/Breadcrumbs';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { fetchProduces, deleteProduce, updateProduceStock } from '../../services/produceService';
import { useAuth } from '../../hooks/useAuth';
import { Package, Plus, Trash2, Edit3, ArrowLeft, AlertCircle, RefreshCw, Layers, CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';

const MyProduce = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [produces, setProduces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Stock edit modal state
  const [editingProduce, setEditingProduce] = useState(null);
  const [stockInput, setStockInput] = useState('');
  const [statusInput, setStatusInput] = useState('AVAILABLE');
  const [stockUpdating, setStockUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadMyProduces = async () => {
    setLoading(true);
    try {
      const res = await fetchProduces();
      if (res.success) {
        // Filter produces for current farmer
        const myItems = res.data.filter(
          (p) => p.farmer?._id === user?._id || p.farmer === user?._id
        );
        setProduces(myItems);
      }
    } catch (err) {
      console.error('Failed to load farmer produce:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadMyProduces();
  }, [user]);

  const handleOpenStockModal = (item) => {
    setEditingProduce(item);
    setStockInput(String(item.availableQuantity));
    setStatusInput(item.status || 'AVAILABLE');
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!editingProduce) return;

    const newQty = Number(stockInput);
    if (isNaN(newQty) || newQty < 0) {
      alert('Available quantity must be a positive number.');
      return;
    }

    setStockUpdating(true);
    try {
      await updateProduceStock(editingProduce._id, {
        availableQuantity: newQty,
        status: statusInput,
      });

      setToastMsg(`Stock updated for ${editingProduce.cropName}!`);
      setTimeout(() => setToastMsg(''), 4000);
      setEditingProduce(null);
      await loadMyProduces();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update stock');
    } finally {
      setStockUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteProduce(deletingId);
      setDeletingId(null);
      setToastMsg('Produce listing removed successfully.');
      setTimeout(() => setToastMsg(''), 4000);
      await loadMyProduces();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete produce listing');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered produce list
  const filteredProduces = produces.filter((p) => {
    const matchesSearch = p.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.variety && p.variety.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalStockQuantity = produces.reduce((acc, p) => acc + (p.availableQuantity || 0), 0);
  const activeCount = produces.filter((p) => p.status === 'AVAILABLE').length;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: 'Farmer Dashboard', path: '/farmer/dashboard' },
            { label: 'My Listed Produce' },
          ]}
        />

        {toastMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header & KPI Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">My Listed Produce & Stock</h1>
              <p className="text-xs text-slate-500">Manage available quantities, live stock updates, and unit pricing</p>
            </div>
          </div>
          <Link
            to="/farmer/add-produce"
            className="px-4 py-2.5 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Produce
          </Link>
        </div>

        {/* Stock Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Items</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{activeCount} listings</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Ready for marketplace purchase</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Available Stock on Hand</span>
            <div className="text-2xl font-black text-agri-700 mt-1">{totalStockQuantity.toLocaleString('en-IN')} units</div>
            <span className="text-[11px] text-slate-500 font-semibold">Across all your listed crops</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Listed Items</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{produces.length} entries</div>
            <span className="text-[11px] text-slate-500 font-semibold">Including sold out & historical listings</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by crop, variety, or category..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="PARTIALLY_SOLD">Partially Sold</option>
              <option value="SOLD_OUT">Sold Out</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Produce Cards Grid */}
        {loading ? (
          <Loading />
        ) : filteredProduces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Produce Listings Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No crops match your current search or status filter. Try clearing filters.'
                  : 'You have not listed any crops yet. Start selling directly to buyers and FPOs.'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'ALL' && (
              <Link
                to="/farmer/add-produce"
                className="px-4 py-2 bg-agri-700 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 hover:bg-agri-800 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Your First Produce
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProduces.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={(p.images && p.images[0]) || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'}
                      alt={p.cropName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={p.status} />
                    </div>
                    {p.category && (
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold bg-slate-900/70 text-white px-2.5 py-1 rounded-full backdrop-blur-xs">
                        {p.category}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{p.cropName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{p.variety || 'Native Hybrid'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Available Stock</span>
                        <span className="font-extrabold text-agri-800 text-sm">
                          {p.availableQuantity?.toLocaleString('en-IN')} {p.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">of {p.quantity} {p.unit} listed</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Price / {p.unit}</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹{p.expectedPrice}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Grade: {p.qualityGrade || 'Grade A'}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Location: {p.location?.city || 'Karnataka'}</span>
                      <span>Min Order: {p.minOrderQuantity || 10} {p.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenStockModal(p)}
                    className="flex-1 py-2 px-3 bg-agri-100 hover:bg-agri-200 text-agri-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingId(p._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stock & Status Update Modal */}
        {editingProduce && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-agri-100 text-agri-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Update Available Stock</h3>
                  <p className="text-xs text-slate-500">{editingProduce.cropName} ({editingProduce.unit})</p>
                </div>
              </div>

              <form onSubmit={handleSaveStock} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1">Available Quantity ({editingProduce.unit}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    placeholder="Enter current available stock"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600 text-sm"
                  />
                  <span className="text-[11px] font-normal text-slate-400 block mt-1">
                    Setting available quantity to 0 will automatically set status to Sold Out.
                  </span>
                </div>

                <div>
                  <label className="block mb-1">Listing Status *</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                  >
                    <option value="AVAILABLE">Available (Active in marketplace)</option>
                    <option value="PARTIALLY_SOLD">Partially Sold</option>
                    <option value="SOLD_OUT">Sold Out</option>
                    <option value="UNAVAILABLE">Unavailable (Temporarily hidden)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingProduce(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stockUpdating}
                    className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {stockUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Produce Listing?"
          message="Are you sure you want to remove this crop from the marketplace? Active orders associated with this listing will remain in history."
          confirmText="Yes, Delete Produce"
          loading={deleteLoading}
        />
      </main>
    </div>
  );
};

export default MyProduce;
