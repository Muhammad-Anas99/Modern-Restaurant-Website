const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null }, // cap for percentage discounts
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usageCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

promoCodeSchema.methods.computeDiscount = function computeDiscount(subtotal) {
  if (!this.active) return { valid: false, reason: 'This promo code is no longer active.' };
  if (this.expiresAt < new Date()) return { valid: false, reason: 'This promo code has expired.' };
  if (this.usageLimit != null && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: 'This promo code has reached its usage limit.' };
  }
  if (subtotal < this.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount is ${this.minOrderAmount}.` };
  }

  let discount =
    this.discountType === 'percentage' ? (subtotal * this.discountValue) / 100 : this.discountValue;

  if (this.maxDiscountAmount != null) discount = Math.min(discount, this.maxDiscountAmount);
  discount = Math.min(discount, subtotal);

  return { valid: true, discount: Math.round(discount * 100) / 100 };
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
