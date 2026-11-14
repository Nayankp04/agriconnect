const mongoose = require('mongoose');

const fpoInventorySchema = new mongoose.Schema(
  {
    fpo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds', 'Dairy', 'Other'],
      default: 'Grains',
    },
    variety: {
      type: String,
      default: 'Standard Grade A',
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Available quantity cannot be negative'],
    },
    qualityGrade: {
      type: String,
      default: 'Grade A',
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'litre', 'bag', 'piece'],
      default: 'kg',
    },
    pricePerUnit: {
      type: Number,
      default: 50,
      min: [0, 'Price must be positive'],
    },
    images: [
      {
        type: String,
      },
    ],
    location: {
      city: { type: String, default: 'Mysuru' },
      district: { type: String, default: 'Mysuru' },
      state: { type: String, default: 'Karnataka' },
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
    sourceFarmers: [
      {
        farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        farmerName: String,
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
        quantity: Number,
        pricePerUnit: Number,
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('FPOInventory', fpoInventorySchema);
