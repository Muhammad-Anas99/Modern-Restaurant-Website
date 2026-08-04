const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, default: 'Foundry & Flame' },
    tagline: { type: String, default: 'Modern wood-fired kitchen' },
    logo: { type: String, default: '' },
    heroImages: { type: [String], default: [] },
    whatsappNumber: { type: String, default: '' }, // digits only, with country code
    contactNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    businessHours: { type: String, default: 'Mon–Sun, 12:00 PM – 11:30 PM' },
    currency: { type: String, default: 'PKR' },
    currencySymbol: { type: String, default: 'Rs.' },
    deliveryFee: { type: Number, default: 150 },
    taxPercent: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number, default: 3000 },
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      tiktok: { type: String, default: '' }
    },
    themeColors: {
      primary: { type: String, default: '#C98A2C' },
      secondary: { type: String, default: '#1F3A34' },
      dark: { type: String, default: '#14110F' }
    }
  },
  { timestamps: true }
);

// Enforced single-document collection: always fetched/updated via findOne, upsert on write.
module.exports = mongoose.model('Settings', settingsSchema);
