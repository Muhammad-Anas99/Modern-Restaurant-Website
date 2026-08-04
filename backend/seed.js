require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Food = require('./models/Food');
const Offer = require('./models/Offer');
const PromoCode = require('./models/PromoCode');
const Settings = require('./models/Settings');

async function run() {
  await connectDB();

  console.log('Clearing existing catalog data...');
  await Promise.all([Category.deleteMany({}), Food.deleteMany({}), Offer.deleteMany({}), PromoCode.deleteMany({})]);

  const categories = await Category.insertMany([
    { name: 'Starters', slug: 'starters', icon: '🔥', sortOrder: 1 },
    { name: 'Grill & Fire', slug: 'grill-fire', icon: '🍖', sortOrder: 2 },
    { name: 'Bowls', slug: 'bowls', icon: '🥗', sortOrder: 3 },
    { name: 'Handheld', slug: 'handheld', icon: '🌯', sortOrder: 4 },
    { name: 'Desserts', slug: 'desserts', icon: '🍮', sortOrder: 5 },
    { name: 'Drinks', slug: 'drinks', icon: '🥤', sortOrder: 6 }
  ]);
  const byName = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  await Food.insertMany([
    {
      name: 'Charred Corn & Halloumi',
      description: 'Flame-licked corn, salted halloumi, chili-lime butter, smoked paprika.',
      category: byName['starters'],
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800',
      originalPrice: 850,
      salePrice: null,
      rating: 4.7,
      ratingCount: 128,
      isFeatured: true,
      isPopular: true
    },
    {
      name: 'Smoked Wings, Three Ways',
      description: 'Dry-rub, honey-chipotle, or classic buffalo — hickory smoked, char-grilled to finish.',
      category: byName['starters'],
      image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?q=80&w=800',
      originalPrice: 1200,
      salePrice: 950,
      rating: 4.8,
      ratingCount: 342,
      isBestseller: true,
      isPopular: true
    },
    {
      name: 'Ember-Roasted Tomahawk',
      description: '600g bone-in ribeye, finished over open coals, herb butter, roasted garlic.',
      category: byName['grill-fire'],
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
      originalPrice: 6500,
      salePrice: null,
      rating: 4.9,
      ratingCount: 89,
      isFeatured: true
    },
    {
      name: 'Wood-Fired Half Chicken',
      description: 'Brined 24 hours, basted in smoked chili oil, served with charred lemon.',
      category: byName['grill-fire'],
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=800',
      originalPrice: 2100,
      salePrice: 1750,
      rating: 4.8,
      ratingCount: 256,
      isBestseller: true,
      isPopular: true,
      isFeatured: true
    },
    {
      name: 'Charcoal Lamb Chops',
      description: 'Six-hour marinade, seared over live fire, mint-pomegranate relish.',
      category: byName['grill-fire'],
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
      originalPrice: 3200,
      salePrice: null,
      rating: 4.9,
      ratingCount: 174
    },
    {
      name: 'Ember Grain Bowl',
      description: 'Charred vegetables, smoked freekeh, tahini, pomegranate, crisped chickpeas.',
      category: byName['bowls'],
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800',
      originalPrice: 1050,
      salePrice: null,
      rating: 4.6,
      ratingCount: 98,
      tags: ['vegetarian']
    },
    {
      name: 'Grilled Salmon Bowl',
      description: 'Miso-glazed salmon, charred greens, sesame rice, pickled ginger.',
      category: byName['bowls'],
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800',
      originalPrice: 1650,
      salePrice: 1400,
      rating: 4.7,
      ratingCount: 143,
      isPopular: true
    },
    {
      name: 'Smoked Brisket Wrap',
      description: '12-hour smoked brisket, pickled slaw, smoked mayo, charred flatbread.',
      category: byName['handheld'],
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800',
      originalPrice: 1150,
      salePrice: null,
      rating: 4.8,
      ratingCount: 211,
      isBestseller: true
    },
    {
      name: 'Fire-Grilled Steak Sandwich',
      description: 'Charred sirloin, caramelized onion, horseradish cream, toasted brioche.',
      category: byName['handheld'],
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
      originalPrice: 1350,
      salePrice: 1100,
      rating: 4.7,
      ratingCount: 167,
      isPopular: true
    },
    {
      name: 'Charred Pineapple Sundae',
      description: 'Caramelized pineapple, vanilla bean ice cream, smoked caramel, toasted coconut.',
      category: byName['desserts'],
      image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?q=80&w=800',
      originalPrice: 750,
      salePrice: null,
      rating: 4.6,
      ratingCount: 87
    },
    {
      name: 'Smoked Chocolate Torte',
      description: 'Dark chocolate torte, smoked sea salt, espresso crumble.',
      category: byName['desserts'],
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800',
      originalPrice: 800,
      salePrice: 650,
      rating: 4.8,
      ratingCount: 112,
      isBestseller: true
    },
    {
      name: 'House Smoked Lemonade',
      description: 'Charred lemon, rosemary syrup, sparkling water.',
      category: byName['drinks'],
      image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?q=80&w=800',
      originalPrice: 450,
      salePrice: null,
      rating: 4.5,
      ratingCount: 64
    }
  ]);

  await Offer.insertMany([
    {
      title: 'Weekend Fire Feast',
      description: 'Every Friday–Sunday, get 20% off all Grill & Fire mains.',
      bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200',
      discountLabel: '20% OFF',
      linkedPromoCode: 'WEEKEND20',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      active: true,
      sortOrder: 1
    },
    {
      title: 'First Order, On the House Delivery',
      description: 'New here? Get free delivery on your first order with code WELCOME10.',
      bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
      discountLabel: 'FREE DELIVERY',
      linkedPromoCode: 'WELCOME10',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      active: true,
      sortOrder: 2
    }
  ]);

  await PromoCode.insertMany([
    {
      code: 'WELCOME10',
      description: '10% off your first order',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscountAmount: 500,
      minOrderAmount: 0,
      usageLimit: null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90)
    },
    {
      code: 'WEEKEND20',
      description: '20% off weekend orders over Rs. 2000',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscountAmount: 1000,
      minOrderAmount: 2000,
      usageLimit: 500,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
    },
    {
      code: 'FLAT300',
      description: 'Flat Rs. 300 off orders over Rs. 1500',
      discountType: 'fixed',
      discountValue: 300,
      minOrderAmount: 1500,
      usageLimit: null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)
    }
  ]);

  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      restaurantName: 'Foundry & Flame',
      tagline: 'A modern wood-fired kitchen',
      whatsappNumber: '923001234567',
      contactNumber: '+92 300 1234567',
      address: 'Plot 12, Khayaban-e-Ittehad, Karachi',
      deliveryFee: 150,
      freeDeliveryThreshold: 3000
    });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'owner@yourrestaurant.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'change_this_password';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'Restaurant Owner',
      email: adminEmail,
      password: adminPassword,
      role: 'superadmin'
    });
    console.log(`Admin account created: ${adminEmail} / (password from .env)`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
