import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import Breadcrumbs from '../../components/Breadcrumbs';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import API from '../../services/api';
import { Layers, Plus, Users, Package, CheckCircle2, Edit3, Trash2, TrendingUp, AlertTriangle, Search } from 'lucide-react';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Form State
  const [cropName, setCropName] = useState('Paddy (Rice)');
  const [category, setCategory] = useState('Grains');
  const [variety, setVariety] = useState('Sona Masoori Grade A');
  const [totalQuantity, setTotalQuantity] = useState('10000');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('45');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [submitting, setSubmitting] = useState(false);

  // Edit Stock State
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState('AVAILABLE');

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/fpo/inventory');
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/fpo/inventory', {
        cropName: cropName.trim(),
        category,
        variety: variety.trim(),
        totalQuantity: Number(totalQuantity),
        unit,
        pricePerUnit: Number(pricePerUnit),
        qualityGrade,
      });
      setShowAddModal(false);
      setToastMsg(`Added ${totalQuantity} ${unit} of ${cropName} to FPO warehouse.`);
      setTimeout(() => setToastMsg(''), 4000);
      loadInventory();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditQty(String(item.availableQuantity));
    setEditPrice(String(item.pricePerUnit || 50));
    setEditStatus(item.status || 'AVAILABLE');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await API.put(`/fpo/inventory/${editingItem._id}`, {
        availableQuantity: Number(editQty),
        pricePerUnit: Number(editPrice),
        status: editStatus,
      });
      setToastMsg(`Inventory updated for ${editingItem.cropName}.`);
      setTimeout(() => setToastMsg(''), 4000);
      setEditingItem(null);
      loadInventory();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update inventory');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/fpo/inventory/${deletingId}`);
      setDeletingId(null);
      setToastMsg('Inventory item removed.');
      setTimeout(() => setToastMsg(''), 4000);
      loadInventory();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to remove inventory item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.variety && item.variety.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAggregatedStock = inventory.reduce((sum, item) => sum + (item.availableQuantity || 0), 0);
  const totalFarmers = inventory.reduce((acc, item) => acc + (item.sourceFarmers?.length || 0), 0);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: 'FPO Dashboard', path: '/fpo/dashboard' },
            { label: 'Aggregated Inventory' },
          ]}
        />

        {toastMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold rounded-2xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Aggregated Warehouse Inventory</h1>
              <p className="text-xs text-slate-500">Manage member farmer pooled stock, manual additions, and bulk dispatch readiness</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add / Pool Products
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Available Warehouse Stock</span>
            <div className="text-2xl font-black text-agri-800 mt-1">{totalAggregatedStock.toLocaleString('en-IN')} units</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Across {inventory.length} distinct commodities</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Farmer Contributions</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalFarmers} batches pooled</div>
            <span className="text-[11px] text-slate-500 font-semibold">Traceable to individual member farms</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bulk Buyer Readiness</span>
            <div className="text-2xl font-black text-amber-700 mt-1">100% Verified</div>
            <span className="text-[11px] text-slate-500 font-semibold">APMC grading standards applied</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory commodities..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
            />
          </div>
        </div>

        {/* Inventory List */}
        {loading ? (
          <Loading />
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Warehouse Inventory Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pool harvests from local farmers or add commodities manually to service institutional bulk buyers.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-agri-700 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 hover:bg-agri-800 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Initial Commodity
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInventory.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{item.cropName}</h3>
                      <span className="text-[10px] font-extrabold bg-agri-100 text-agri-800 px-2 py-0.5 rounded-full">
                        {item.qualityGrade || 'Grade A'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{item.variety || 'APMC Certified Standard'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Adjust Stock
                    </button>
                    <button
                      onClick={() => setDeletingId(item._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Available for Dispatch</span>
                    <span className="text-base font-extrabold text-agri-800">
                      {item.availableQuantity?.toLocaleString('en-IN')} {item.unit || 'kg'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Reserved for Orders</span>
                    <span className="text-base font-extrabold text-amber-700">
                      {item.reservedQuantity || 0} {item.unit || 'kg'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Total Pooled Quantity</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {item.totalQuantity?.toLocaleString('en-IN')} {item.unit || 'kg'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Unit Selling Price</span>
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{item.pricePerUnit || 50} / {item.unit || 'kg'}
                    </span>
                  </div>
                </div>

                {/* Farmer Contributions Section */}
                {item.sourceFarmers && item.sourceFarmers.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                      Contributing Member Farmers ({item.sourceFarmers.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.sourceFarmers.map((sf, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2"
                        >
                          <span className="font-bold text-slate-800">{sf.farmerName || 'Farmer'}</span>
                          <span className="text-agri-700 font-extrabold">+{sf.quantity} {item.unit || 'kg'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Inventory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add / Pool Warehouse Inventory</h3>
                  <p className="text-xs text-slate-500">Record aggregated commodity stock with positive quantities and units</p>
                </div>
              </div>

              <form onSubmit={handleAddStock} className="space-y-4 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Commodity / Crop Name *</label>
                    <input
                      type="text"
                      required
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    >
                      <option value="Grains">Grains (Rice, Wheat, Ragi)</option>
                      <option value="Pulses">Pulses (Toor, Moong)</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Spices">Spices</option>
                      <option value="Oilseeds">Oilseeds</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Unit *</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">Quintal</option>
                      <option value="ton">Ton</option>
                      <option value="bag">Bag</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Price per {unit} (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Quality Grade</label>
                    <select
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    >
                      <option value="Grade A">Grade A (Supermarket Premium)</option>
                      <option value="Grade B">Grade B (Standard Market)</option>
                      <option value="Grade C">Grade C (Processing)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Variety / Strain</label>
                    <input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Stock Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Adjust FPO Stock Level</h3>
                  <p className="text-xs text-slate-500">{editingItem.cropName} ({editingItem.unit || 'kg'})</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1">Available Quantity ({editingItem.unit || 'kg'}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600 text-sm"
                  />
                  <span className="text-[11px] font-normal text-slate-400 block mt-1">
                    Update after batch sales, dispatches, or inventory loss.
                  </span>
                </div>

                <div>
                  <label className="block mb-1">Unit Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                  />
                </div>

                <div>
                  <label className="block mb-1">Stock Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                  >
                    <option value="AVAILABLE">Available for Bulk Orders</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="UNAVAILABLE">Unavailable / Reserved</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    Save Changes
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
          title="Remove Inventory Item?"
          message="Are you sure you want to delete this commodity from FPO warehouse records?"
          confirmText="Yes, Remove Item"
          loading={deleteLoading}
        />
      </main>
    </div>
  );
};

export default Inventory;
