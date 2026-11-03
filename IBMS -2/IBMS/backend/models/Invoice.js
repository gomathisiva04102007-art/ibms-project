const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  hsnCode: {
    type: String,
    trim: true,
    default: '',
  },
  unit: {
    type: String,
    trim: true,
    default: 'PCS',
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be greater than 0'],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  discountValue: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  gstRate: {
    type: Number,
    required: true,
    enum: [0, 5, 12, 18, 28],
    default: 18,
  },
  cgstRate: {
    type: Number,
    default: 0,
  },
  cgstAmount: {
    type: Number,
    default: 0,
  },
  sgstRate: {
    type: Number,
    default: 0,
  },
  sgstAmount: {
    type: Number,
    default: 0,
  },
  igstRate: {
    type: Number,
    default: 0,
  },
  igstAmount: {
    type: Number,
    default: 0,
  },
  totalTaxAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      billingAddress: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, required: true },
      postalCode: { type: String, default: '' },
      gstin: { type: String, default: '' },
      pan: { type: String, default: '' },
    },
    businessSnapshot: {
      businessName: { type: String, required: true },
      legalName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      gstin: { type: String, default: '' },
      pan: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      bankDetails: {
        bankName: { type: String, default: '' },
        accountHolder: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        branch: { type: String, default: '' },
        upiId: { type: String, default: '' },
      },
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    placeOfSupply: {
      type: String,
      required: true,
      trim: true,
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    items: {
      type: [invoiceItemSchema],
      validate: [v => Array.isArray(v) && v.length > 0, 'Invoice must have at least one line item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalIgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTax: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Voided'],
      default: 'Unpaid',
    },
    notes: {
      type: String,
      default: '',
    },
    terms: {
      type: String,
      default: '',
    },
    voidReason: {
      type: String,
      default: '',
    },
    voidedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ user: 1, customer: 1 });
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, issueDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
