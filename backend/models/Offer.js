const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bannerImage: { type: String, required: true },
    discountLabel: { type: String, required: true, trim: true }, // e.g. "20% OFF" or "BOGO"
    linkedPromoCode: { type: String, trim: true, uppercase: true },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

offerSchema.virtual('isCurrentlyLive').get(function () {
  const now = new Date();
  return this.active && this.startsAt <= now && this.expiresAt >= now;
});
offerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Offer', offerSchema);
