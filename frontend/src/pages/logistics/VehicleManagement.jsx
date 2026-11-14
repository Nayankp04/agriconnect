import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import API from '../../services/api';
import Modal from '../../components/Modal';
import ImageUploader from '../../components/ImageUploader';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import Breadcrumbs from '../../components/Breadcrumbs';
import {
  Truck,
  Plus,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Search,
  Filter,
  Phone,
  User,
  MapPin,
  Calendar,
  Gauge,
  Sliders,
  DollarSign
} from 'lucide-react';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newAvailableCapacity, setNewAvailableCapacity] = useState('');
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Registration Form State
  const [vehicleType, setVehicleType] = useState('Container Truck 10-Ton');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [capacityTons, setCapacityTons] = useState('10');
  const [availableCapacityTons, setAvailableCapacityTons] = useState('10');
  const [pricePerKm, setPricePerKm] = useState('35');
  const [pricePerTon, setPricePerTon] = useState('120');
  const [currentCity, setCurrentCity] = useState('Mysuru');
  const [serviceLocations, setServiceLocations] = useState('Mysuru, Bengaluru, Mandya, Hassan');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [images, setImages] = useState([]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await API.get('/logistics/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleOpenAddModal = () => {
    setVehicleType('Container Truck 10-Ton');
    setRegistrationNumber(`KA-09-F-${Math.floor(1000 + Math.random() * 9000)}`);
    setCapacityTons('10');
    setAvailableCapacityTons('10');
    setPricePerKm('35');
    setPricePerTon('120');
    setCurrentCity('Mysuru');
    setServiceLocations('Mysuru, Bengaluru, Mandya, Hassan');
    setDriverName('Ramesh Kumar');
    setDriverPhone('+91 9876543210');
    setContactName('');
    setContactPhone('');
    setImages([]);
    setShowAddModal(true);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsedLocations = serviceLocations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await API.post('/logistics/vehicles', {
        vehicleType,
        registrationNumber: registrationNumber.trim().toUpperCase(),
        capacityTons: Number(capacityTons),
        availableCapacityTons: Number(availableCapacityTons),
        pricePerKm: Number(pricePerKm),
        pricePerTon: Number(pricePerTon),
        currentCity,
        serviceLocations: parsedLocations.length > 0 ? parsedLocations : [currentCity],
        driverName,
        driverPhone,
        contactName: contactName || driverName,
        contactPhone: contactPhone || driverPhone,
        images,
        status: 'AVAILABLE',
        isAvailable: true,
      });

      if (res.data.success) {
        setShowAddModal(false);
        loadVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to register vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const openCapacityModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setNewAvailableCapacity(vehicle.availableCapacityTons ?? vehicle.capacityTons);
    setNewStatus(vehicle.status || 'AVAILABLE');
    setShowCapacityModal(true);
  };

  const handleUpdateCapacityAndStatus = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setSubmitting(true);
    try {
      const cap = Number(newAvailableCapacity);
      if (cap < 0 || cap > selectedVehicle.capacityTons) {
        alert(`Available capacity must be between 0 and maximum payload (${selectedVehicle.capacityTons} Tons)`);
        setSubmitting(false);
        return;
      }

      await API.put(`/logistics/vehicles/${selectedVehicle._id}`, {
        availableCapacityTons: cap,
        status: newStatus,
        isAvailable: newStatus === 'AVAILABLE' && cap > 0,
      });

      setShowCapacityModal(false);
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteVehicle = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteModalOpen(true);
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await API.delete(`/logistics/vehicles/${vehicleToDelete._id}`);
      setDeleteModalOpen(false);
      setVehicleToDelete(null);
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete vehicle');
    }
  };

  // Metrics calculation
  const totalFleet = vehicles.length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacityTons || 0), 0);
  const totalAvailableCapacity = vehicles.reduce(
    (sum, v) => sum + (v.status === 'AVAILABLE' ? (v.availableCapacityTons ?? v.capacityTons) : 0),
    0
  );
  const activeVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length;

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.currentCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driverName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full">Available</span>;
      case 'BUSY':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-full">On Route / Busy</span>;
      case 'MAINTENANCE':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full">Maintenance</span>;
      case 'UNAVAILABLE':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-[11px] rounded-full">Unavailable</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-[11px] rounded-full">{status}</span>;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: 'Logistics Partner', path: '/dashboard/logistics' },
            { label: 'Fleet Management', active: true },
          ]}
        />

        {/* Top Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Fleet & Vehicle Capacity Management</h1>
              <p className="text-xs text-slate-500">
                Register vehicles, upload truck photos, and manage live payload capacity for crop dispatch
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Register New Vehicle
          </button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Fleet</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalFleet}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{activeVehicles} ready for dispatch</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Payload</span>
            <div className="text-2xl font-black text-purple-700 mt-1">{totalCapacity.toFixed(1)} <span className="text-xs font-semibold text-slate-500">Tons</span></div>
            <p className="text-[11px] text-slate-500 mt-0.5">Gross fleet capacity</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Capacity</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalAvailableCapacity.toFixed(1)} <span className="text-xs font-semibold text-slate-500">Tons</span></div>
            <p className="text-[11px] text-slate-500 mt-0.5">Unallocated load volume</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Status</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{((activeVehicles / (totalFleet || 1)) * 100).toFixed(0)}%</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Fleet availability rate</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by registration, model, driver, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">On Route / Busy</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Fleet Grid */}
        {loading ? (
          <Loading text="Loading fleet vehicles and capacity data..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((v) => (
                <div key={v._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  {/* Vehicle Image Banner */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {v.images && v.images.length > 0 ? (
                      <img
                        src={v.images[0]}
                        alt={v.vehicleType}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Truck className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-[11px] font-semibold mt-1">No vehicle photo</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold tracking-wider">
                      {v.registrationNumber}
                    </div>
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(v.status)}
                    </div>
                  </div>

                  {/* Vehicle Details Body */}
                  <div className="p-5 space-y-4 flex-1">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{v.vehicleType}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Base: <strong>{v.currentCity || 'Mysuru'}</strong></span>
                      </div>
                    </div>

                    {/* Capacity & Rates Box */}
                    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-purple-600" />
                          Payload Capacity:
                        </span>
                        <span className="font-bold text-slate-900">{v.capacityTons} Tons</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                          Available Capacity:
                        </span>
                        <span className="font-black text-emerald-700">
                          {v.availableCapacityTons ?? v.capacityTons} Tons
                        </span>
                      </div>
                      <div className="border-t border-purple-100 pt-2 flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                          Pricing Rates:
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-purple-800">₹{v.pricePerKm}/km</span>
                          {v.pricePerTon > 0 && (
                            <span className="text-[10px] text-slate-500 block">or ₹{v.pricePerTon}/ton</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Driver & Route Info */}
                    <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <User className="w-3 h-3 text-slate-400" /> Driver:
                        </span>
                        <strong className="text-slate-800">{v.driverName || 'Not Assigned'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" /> Phone:
                        </span>
                        <span className="font-medium text-slate-700">{v.driverPhone || 'N/A'}</span>
                      </div>
                      {v.serviceLocations && v.serviceLocations.length > 0 && (
                        <div className="pt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-600">Routes:</span> {v.serviceLocations.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openCapacityModal(v)}
                      className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-purple-200"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Adjust Capacity
                    </button>
                    <button
                      onClick={() => confirmDeleteVehicle(v)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                      title="Remove Vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                <Truck className="w-12 h-12 stroke-[1.5] mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No vehicles match your criteria</p>
                <p className="mt-1">Click 'Register New Vehicle' to add trucks to your transport fleet.</p>
              </div>
            )}
          </div>
        )}

        {/* Register Vehicle Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register Logistics Vehicle"
        >
          <form className="space-y-4 max-h-[75vh] overflow-y-auto pr-1" onSubmit={handleAddVehicle}>
            <ImageUploader
              images={images}
              onChange={setImages}
              maxImages={3}
              label="Vehicle Photographs"
              helpText="Upload clean front or side angle photos of the vehicle (Max 3, up to 5MB each)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type / Model</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Container Truck 10-Ton">Container Truck (10-Ton)</option>
                  <option value="Eicher 5-Ton">Eicher Medium Truck (5-Ton)</option>
                  <option value="Pickup Van 2-Ton">Pickup Van (2-Ton)</option>
                  <option value="Refrigerated Truck 8-Ton">Refrigerated Cold Truck (8-Ton)</option>
                  <option value="Heavy Trailer 20-Ton">Heavy Trailer (20-Ton)</option>
                  <option value="Three-Wheeler Auto Cargo 0.5-Ton">Three-Wheeler Cargo (0.5-Ton)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Plate (Required)</label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="KA-09-F-1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Payload (Tons)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={capacityTons}
                  onChange={(e) => {
                    setCapacityTons(e.target.value);
                    setAvailableCapacityTons(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Available Load (Tons)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={capacityTons}
                  required
                  value={availableCapacityTons}
                  onChange={(e) => setAvailableCapacityTons(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rate / Km (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rate / Ton (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={pricePerTon}
                  onChange={(e) => setPricePerTon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base / Current City</label>
                <input
                  type="text"
                  required
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  placeholder="e.g. Mysuru"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Locations / Routes</label>
                <input
                  type="text"
                  value={serviceLocations}
                  onChange={(e) => setServiceLocations(e.target.value)}
                  placeholder="e.g. Mysuru, Mandya, Bengaluru"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Driver Full Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver Phone Number</label>
                <input
                  type="tel"
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                {submitting ? 'Registering...' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Quick Capacity & Status Adjustment Modal */}
        <Modal
          isOpen={showCapacityModal}
          onClose={() => setShowCapacityModal(false)}
          title={`Adjust Vehicle Capacity: ${selectedVehicle?.registrationNumber || ''}`}
        >
          <form className="space-y-4" onSubmit={handleUpdateCapacityAndStatus}>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-800">{selectedVehicle?.vehicleType}</p>
              <p className="text-slate-500">Max Gross Payload: <strong className="text-slate-900">{selectedVehicle?.capacityTons} Tons</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Available Capacity (Tons)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={selectedVehicle?.capacityTons || 100}
                required
                value={newAvailableCapacity}
                onChange={(e) => setNewAvailableCapacity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Set to 0 if the vehicle is currently full or dispatched on a journey.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operational Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="AVAILABLE">Available (Ready for assignment)</option>
                <option value="BUSY">On Route / Busy</option>
                <option value="MAINTENANCE">Maintenance / Servicing</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCapacityModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow"
              >
                {submitting ? 'Saving...' : 'Save Capacity'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteVehicle}
          title="Remove Vehicle from Fleet"
          message={`Are you sure you want to remove vehicle ${vehicleToDelete?.registrationNumber || ''} (${vehicleToDelete?.vehicleType || ''})? This will stop it from appearing in marketplace transport searches.`}
          confirmText="Yes, Remove Vehicle"
        />
      </main>
    </div>
  );
};

export default VehicleManagement;
