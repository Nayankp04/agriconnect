const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      default: 'Standard Native',
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds', 'Dairy', 'Other'],
      default: 'Vegetables',
    },
    quantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'litre', 'bag', 'piece'],
      default: 'kg',
    },
    expectedPrice: {
      type: Number,
      required: [true, 'Expected price is required'],
      min: [0, 'Price must be positive'],
    },
    minOrderQuantity: {
      type: Number,
      default: 10,
    },
    harvestDate: {
      type: Date,
      default: Date.now,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    qualityGrade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Grade C', 'Organic Premium'],
      default: 'Grade A',
    },
    location: {
      city: { type: String, default: 'Mysuru' },
      district: { type: String, default: 'Mysuru' },
      state: { type: String, default: 'Karnataka' },
      address: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    images: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      default: 'Fresh high quality produce harvested directly from farm.',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'PARTIALLY_SOLD', 'SOLD_OUT', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Produce', produceSchema);
