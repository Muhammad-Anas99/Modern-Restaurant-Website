const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    image: { type: String, required: true },
    originalPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null }, // null = no discount
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
    ratingCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    spiceLevel: { type: Number, min: 0, max: 3, default: 0 },
    tags: [{ type: String, trim: true }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// A sale price only applies if it's set and lower than the original price
foodSchema.virtual('effectivePrice').get(function () {
  if (this.salePrice != null && this.salePrice < this.originalPrice) return this.salePrice;
  return this.originalPrice;
});

foodSchema.virtual('discountPercent').get(function () {
  if (this.salePrice != null && this.salePrice < this.originalPrice) {
    return Math.round(((this.originalPrice - this.salePrice) / this.originalPrice) * 100);
  }
  return 0;
});

foodSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Food', foodSchema);
