const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema(
  {
    registrationToken: {
      type: String,
      required: [true, 'Registration token is required'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['FARMER', 'FPO', 'BUYER', 'LOGISTICS'],
      default: 'FARMER',
    },
    organizationName: {
      type: String,
      trim: true,
      default: '',
    },
    businessType: {
      type: String,
      trim: true,
      default: 'Supermarket',
    },
    location: {
      city: { type: String, default: 'Mysuru' },
      district: { type: String, default: 'Mysuru' },
      state: { type: String, default: 'Karnataka' },
      address: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24-hour TTL index
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);

