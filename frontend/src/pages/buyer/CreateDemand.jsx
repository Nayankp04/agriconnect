import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Breadcrumbs from '../../components/Breadcrumbs';
import ImageUploader from '../../components/ImageUploader';
import { createBuyerDemand } from '../../services/buyerService';
import { ShoppingCart, PlusCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const CreateDemand = () => {
  const navigate = useNavigate();

  const [cropName, setCropName] = useState('Fresh Yellow Onions');
  const [category, setCategory] = useState('Vegetables');
  const [requiredQuantity, setRequiredQuantity] = useState('10000');
  const [unit, setUnit] = useState('kg');
  const [targetPrice, setTargetPrice] = useState('28');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [city, setCity] = useState('Bengaluru');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [address, setAddress] = useState('Yeshwanthpur Wholesale Market Distribution Hub');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState(
    'Need graded yellow onions in standard mesh bags for supermarket and food service supply. Direct farm pickup or warehouse delivery accepted.'
  );

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(requiredQuantity);
    const price = Number(targetPrice);

    if (qty <= 0) {
      setError('Required quantity must be greater than 0.');
      return;
    }
    if (price <= 0) {
      setError('Target price must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await createBuyerDemand({
        cropName: cropName.trim(),
        category,
        requiredQuantity: qty,
        unit,
        targetPrice: price,
        qualityGrade,
        location: { city, district, state: 'Karnataka', address },
        deadline: new Date(deadline),
        requiredDeliveryDate: new Date(deadline),
        images: images,
        referenceImage: images[0] || '',
        description,
      });
      navigate('/buyer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to post bulk purchase requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: 'Buyer Dashboard', path: '/buyer/dashboard' },
            { label: 'Create Purchase Requirement' },
          ]}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Post Bulk Purchase Requirement</h1>
              <p className="text-xs text-slate-500">
                Specify commodities, expected procurement price, target delivery location, and reference specs
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-slate-700">
            {/* Reference Image Uploader */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <ImageUploader
                label="Reference Product Photo (Optional)"
                images={images}
                onImagesChange={setImages}
                maxImages={2}
                helperText="Upload sample specification or desired quality standard images"
              />
            </div>

            {/* Product & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold">Commodity Needed *</label>
                <input
                  type="text"
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Potatoes, Sona Masoori Rice"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains (Rice, Wheat, Ragi)</option>
                  <option value="Pulses">Pulses (Toor, Moong)</option>
                  <option value="Spices">Spices</option>
                  <option value="Oilseeds">Oilseeds</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Quantity, Unit & Target Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-bold">Required Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">Measurement Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="quintal">Quintal (100 kg)</option>
                  <option value="ton">Ton (1000 kg)</option>
                  <option value="bag">Bag (50 kg sack)</option>
                  <option value="litre">Litre</option>
                  <option value="piece">Piece / Unit</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold">Target Price per {unit} (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            {/* Quality & Delivery Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold">Required Quality Grade</label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="Grade A">Grade A (Supermarket Premium)</option>
                  <option value="Grade B">Grade B (Standard Wholesale)</option>
                  <option value="Grade C">Grade C (Food Processing)</option>
                  <option value="Organic Premium">Organic Certified</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold">Required Delivery Date / Deadline *</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            {/* Delivery Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold">Delivery City / Hub *</label>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setDistrict(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mysuru">Mysuru</option>
                  <option value="Mandya">Mandya</option>
                  <option value="Hassan">Hassan</option>
                  <option value="Hubballi">Hubballi</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold">Warehouse / Delivery Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Gate 4, APMC Yard, Yeshwanthpur"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 font-bold">Procurement Specifications & Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention packaging specifications, moisture levels, transport arrangements..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? 'Publishing Purchase Requirement...' : 'Publish Purchase Requirement'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateDemand;
