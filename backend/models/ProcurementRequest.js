const mongoose = require('mongoose');

const procurementRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterRole: {
      type: String,
      enum: ['FPO', 'BUYER'],
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
    requiredQuantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    fulfilledQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'litre', 'bag', 'piece'],
      default: 'kg',
    },
    targetPrice: {
      type: Number,
      required: true,
      min: [0, 'Target price must be positive'],
    },
    qualityGrade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Grade C', 'Organic Premium'],
      default: 'Grade A',
    },
    location: {
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, default: 'Karnataka' },
      address: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    images: [
      {
        type: String,
      },
    ],
    referenceImage: {
      type: String,
      default: '',
    },
    deadline: {
      type: Date,
      required: true,
    },
    requiredDeliveryDate: {
      type: Date,
      default: function () {
        return this.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      },
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'],
      default: 'OPEN',
    },
    responses: [
      {
        responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        offeredQuantity: { type: Number, required: true },
        pricePerUnit: { type: Number, required: true },
        note: String,
        status: {
          type: String,
          enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
          default: 'PENDING',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProcurementRequest', procurementRequestSchema);
