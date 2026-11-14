const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    capacityTons: {
      type: Number,
      required: true,
      min: [0.1, 'Capacity must be at least 0.1 tons'],
    },
    availableCapacityTons: {
      type: Number,
      default: function () {
        return this.capacityTons || 5;
      },
      min: [0, 'Available capacity cannot be negative'],
    },
    serviceLocations: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    pricePerKm: {
      type: Number,
      required: true,
      min: [0, 'Price per km must be positive'],
    },
    pricePerTon: {
      type: Number,
      default: 0,
    },
    currentCity: {
      type: String,
      default: 'Mysuru',
    },
    availableDate: {
      type: Date,
      default: Date.now,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'MAINTENANCE', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
    driverName: {
      type: String,
      default: 'Ramesh Kumar',
    },
    driverPhone: {
      type: String,
      default: '+91 9876543210',
    },
    contactName: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
