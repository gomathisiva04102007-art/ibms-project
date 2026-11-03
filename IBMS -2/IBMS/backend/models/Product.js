const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product or service name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    hsnCode: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['product', 'service'],
      default: 'product',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    gstRate: {
      type: Number,
      required: [true, 'Applicable GST rate is required'],
      enum: [0, 5, 12, 18, 28],
      default: 18,
    },
    unit: {
      type: String,
      trim: true,
      default: 'PCS',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ user: 1, name: 1 });
productSchema.index({ user: 1, code: 1 });

module.exports = mongoose.model('Product', productSchema);
