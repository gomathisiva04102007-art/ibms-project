const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Please provide business name'],
      trim: true,
      default: 'Apex Invoicing & Billing',
    },
    legalName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '101, Business Park, Tech Zone',
    },
    city: {
      type: String,
      trim: true,
      default: 'Mumbai',
    },
    state: {
      type: String,
      trim: true,
      default: 'Maharashtra',
    },
    postalCode: {
      type: String,
      trim: true,
      default: '400001',
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    invoicePrefix: {
      type: String,
      trim: true,
      default: 'INV',
    },
    invoiceNextNumber: {
      type: Number,
      default: 1001,
    },
    defaultPaymentTerms: {
      type: String,
      default: 'Payment due within 15 days of invoice date.',
    },
    defaultNotes: {
      type: String,
      default: 'Thank you for your business! Please make payments to the account specified below.',
    },
    bankDetails: {
      bankName: { type: String, default: 'HDFC Bank Ltd' },
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '50100234567890' },
      ifscCode: { type: String, default: 'HDFC0001234' },
      branch: { type: String, default: 'Fort Branch' },
      upiId: { type: String, default: 'business@upi' },
    },
    logoUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
