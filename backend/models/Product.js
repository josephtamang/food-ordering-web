const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  images: [{
    type: String,
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isVeg: {
    type: Boolean,
    default: false,
  },
  // Discount & Promotional Fields
  discountType: {
    type: String,
    enum: ['none', 'percentage', 'fixed', 'bogo', 'combo'],
    default: 'none',
  },
  discountValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  // For BOGO offers - "Buy X Get Y"
  bogoConfig: {
    buyQuantity: { type: Number, default: 0 },
    getQuantity: { type: Number, default: 0 },
  },
  // Combo deals
  comboItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  comboPrice: {
    type: Number,
    default: 0,
  },
  // Promotional Flags (restaurant terminology)
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isHotDeal: {
    type: Boolean,
    default: false,
  },
  isDailySpecial: {
    type: Boolean,
    default: false,
  },
  isChefSpecial: {
    type: Boolean,
    default: false,
  },
  // Offer details
  offerLabel: {
    type: String,
    default: '',
  },
  offerValidUntil: {
    type: Date,
    default: null,
  },
}, { timestamps: true, toJSON: { virtuals: true } });

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isFeatured: 1, isHotDeal: 1, isDailySpecial: 1, isChefSpecial: 1 });
productSchema.index({ discountType: 1, offerValidUntil: 1 });

// Virtual field for calculated final price
productSchema.virtual('finalPrice').get(function() {
  if (this.discountType === 'percentage') {
    return Math.round((this.price - (this.price * this.discountValue / 100)) * 100) / 100;
  } else if (this.discountType === 'fixed') {
    return Math.max(0, Math.round((this.price - this.discountValue) * 100) / 100);
  } else if (this.discountType === 'combo' && this.comboPrice > 0) {
    return this.comboPrice;
  }
  return this.price;
});

// Virtual field for savings amount
productSchema.virtual('savingsAmount').get(function() {
  return Math.round((this.price - this.finalPrice) * 100) / 100;
});

// Virtual field for savings percentage
productSchema.virtual('savingsPercentage').get(function() {
  if (this.price === 0) return 0;
  return Math.round(((this.price - this.finalPrice) / this.price * 100) * 100) / 100;
});

module.exports = mongoose.model('Product', productSchema);
