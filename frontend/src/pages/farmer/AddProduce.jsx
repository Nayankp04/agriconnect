import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Breadcrumbs from '../../components/Breadcrumbs';
import ImageUploader from '../../components/ImageUploader';
import { createProduce } from '../../services/produceService';
import { PlusCircle, Sprout, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const AddProduce = () => {
  const navigate = useNavigate();

  const [cropName, setCropName] = useState('Fresh Red Tomatoes');
  const [variety, setVariety] = useState('Roma Hybrid Special');
  const [category, setCategory] = useState('Vegetables');
  const [quantity, setQuantity] = useState('2000');
  const [unit, setUnit] = useState('kg');
  const [expectedPrice, setExpectedPrice] = useState('32');
  const [minOrderQuantity, setMinOrderQuantity] = useState('100');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [city, setCity] = useState('Mysuru');
  const [district, setDistrict] = useState('Mysuru');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);
  const [images, setImages] = useState([
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  ]);
  const [description, setDescription] = useState('Farm-fresh produce with natural compost fertilization. Available for immediate dispatch to APMC or direct buyers.');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    const price = Number(expectedPrice);

    if (qty <= 0) {
      setError('Available quantity must be greater than 0.');
      return;
    }
    if (price <= 0) {
      setError('Price per unit must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await createProduce({
        cropName: cropName.trim(),
        variety: variety.trim(),
        category,
        quantity: qty,
        unit,
        expectedPrice: price,
        minOrderQuantity: Number(minOrderQuantity) || 10,
        qualityGrade,
        harvestDate: new Date(harvestDate),
        availableFrom: new Date(availableFrom),
        location: { city, district, state: 'Karnataka' },
        images: images.length ? images : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
        description,
      });
      navigate('/farmer/produce');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create produce listing.');
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
            { label: 'Farmer Dashboard', path: '/farmer/dashboard' },
            { label: 'My Produce', path: '/farmer/produce' },
            { label: 'Add Produce' },
          ]}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Produce List
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-agri-100 text-agri-700 flex items-center justify-center font-bold">
              <Sprout className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">List New Crop / Produce</h1>
              <p className="text-xs text-slate-500">Provide accurate manual quantities, measurement units & photos for buyers and FPOs</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-slate-700">
            {/* Image Uploader Component */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <ImageUploader
                label="Crop & Product Images"
                images={images}
                onImagesChange={setImages}
                maxImages={4}
                helperText="Upload clear pictures of your harvest or field (JPEG, PNG, max 5MB)"
              />
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-bold">Product / Crop Name *</label>
                <input
                  type="text"
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Sona Masoori Rice, Tomatoes"
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
                  <option value="Pulses">Pulses (Toor Dal, Moong)</option>
                  <option value="Spices">Spices (Pepper, Cardamom)</option>
                  <option value="Oilseeds">Oilseeds (Groundnut, Mustard)</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold">Variety / Subtype</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. Roma, Hybrid, Local Desi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            {/* Quantity, Unit & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-bold">Available Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500"
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
                <label className="block mb-1 font-bold">Price per {unit} (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            {/* Minimum Order & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-bold">Minimum Order Quantity ({unit})</label>
                <input
                  type="number"
                  min="1"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">Harvest Date</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">Expected Available Date</label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            {/* Location & Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-bold">Quality Grade</label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="Grade A">Grade A (Export / Supermarket Quality)</option>
                  <option value="Grade B">Grade B (Standard Market Quality)</option>
                  <option value="Grade C">Grade C (Processing Quality)</option>
                  <option value="Organic Premium">Organic Certified Premium</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold">City / APMC Location</label>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setDistrict(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="Mysuru">Mysuru</option>
                  <option value="Mandya">Mandya</option>
                  <option value="Hassan">Hassan</option>
                  <option value="Kodagu">Kodagu</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Chamarajanagar">Chamarajanagar</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold">District</label>
                <input
                  type="text"
                  value={district}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 font-bold">Description & Farming Details</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention organic practices, water source, packaging details..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-agri-700 to-emerald-700 hover:from-agri-800 hover:to-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? 'Publishing Produce Listing...' : 'Publish Produce Listing'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddProduce;
