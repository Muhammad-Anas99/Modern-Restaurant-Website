/**
 * SAMPLE DATA — used only as a fallback when the backend API (js/api.js) can't be
 * reached, so the site still looks and works fully in a standalone preview/demo.
 * Once the real backend is running, every one of these is fetched from MongoDB
 * instead and this file is never touched.
 */
const SAMPLE_CATEGORIES = [
  { _id: 'cat-starters', name: 'Starters', slug: 'starters', icon: '🔥' },
  { _id: 'cat-grill', name: 'Grill & Fire', slug: 'grill-fire', icon: '🍖' },
  { _id: 'cat-bowls', name: 'Bowls', slug: 'bowls', icon: '🥗' },
  { _id: 'cat-handheld', name: 'Handheld', slug: 'handheld', icon: '🌯' },
  { _id: 'cat-desserts', name: 'Desserts', slug: 'desserts', icon: '🍮' },
  { _id: 'cat-drinks', name: 'Drinks', slug: 'drinks', icon: '🥤' }
];

const SAMPLE_FOODS = [
  { _id: 'f1', name: 'Charred Corn & Halloumi', description: 'Flame-licked corn, salted halloumi, chili-lime butter.', category: 'cat-starters', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800', originalPrice: 850, salePrice: null, rating: 4.7, ratingCount: 128, isFeatured: true, isPopular: true, isAvailable: true },
  { _id: 'f2', name: 'Smoked Wings, Three Ways', description: 'Dry-rub, honey-chipotle, or classic buffalo — hickory smoked.', category: 'cat-starters', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?q=80&w=800', originalPrice: 1200, salePrice: 950, rating: 4.8, ratingCount: 342, isBestseller: true, isPopular: true, isAvailable: true },
  { _id: 'f3', name: 'Ember-Roasted Tomahawk', description: '600g bone-in ribeye, finished over open coals, herb butter.', category: 'cat-grill', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800', originalPrice: 6500, salePrice: null, rating: 4.9, ratingCount: 89, isFeatured: true, isAvailable: true },
  { _id: 'f4', name: 'Wood-Fired Half Chicken', description: 'Brined 24 hours, basted in smoked chili oil, charred lemon.', category: 'cat-grill', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=800', originalPrice: 2100, salePrice: 1750, rating: 4.8, ratingCount: 256, isBestseller: true, isPopular: true, isFeatured: true, isAvailable: true },
  { _id: 'f5', name: 'Charcoal Lamb Chops', description: 'Six-hour marinade, seared over live fire, mint-pomegranate relish.', category: 'cat-grill', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800', originalPrice: 3200, salePrice: null, rating: 4.9, ratingCount: 174, isAvailable: true },
  { _id: 'f6', name: 'Ember Grain Bowl', description: 'Charred vegetables, smoked freekeh, tahini, pomegranate.', category: 'cat-bowls', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800', originalPrice: 1050, salePrice: null, rating: 4.6, ratingCount: 98, isAvailable: true },
  { _id: 'f7', name: 'Grilled Salmon Bowl', description: 'Miso-glazed salmon, charred greens, sesame rice, pickled ginger.', category: 'cat-bowls', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800', originalPrice: 1650, salePrice: 1400, rating: 4.7, ratingCount: 143, isPopular: true, isAvailable: true },
  { _id: 'f8', name: 'Smoked Brisket Wrap', description: '12-hour smoked brisket, pickled slaw, smoked mayo, flatbread.', category: 'cat-handheld', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800', originalPrice: 1150, salePrice: null, rating: 4.8, ratingCount: 211, isBestseller: true, isAvailable: true },
  { _id: 'f9', name: 'Fire-Grilled Steak Sandwich', description: 'Charred sirloin, caramelized onion, horseradish cream.', category: 'cat-handheld', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800', originalPrice: 1350, salePrice: 1100, rating: 4.7, ratingCount: 167, isPopular: true, isAvailable: true },
  { _id: 'f10', name: 'Charred Pineapple Sundae', description: 'Caramelized pineapple, vanilla bean ice cream, smoked caramel.', category: 'cat-desserts', image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?q=80&w=800', originalPrice: 750, salePrice: null, rating: 4.6, ratingCount: 87, isAvailable: true },
  { _id: 'f11', name: 'Smoked Chocolate Torte', description: 'Dark chocolate torte, smoked sea salt, espresso crumble.', category: 'cat-desserts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800', originalPrice: 800, salePrice: 650, rating: 4.8, ratingCount: 112, isBestseller: true, isAvailable: true },
  { _id: 'f12', name: 'House Smoked Lemonade', description: 'Charred lemon, rosemary syrup, sparkling water.', category: 'cat-drinks', image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?q=80&w=800', originalPrice: 450, salePrice: null, rating: 4.5, ratingCount: 64, isAvailable: true }
];

const SAMPLE_OFFERS = [
  { _id: 'o1', title: 'Weekend Fire Feast', description: 'Every Friday–Sunday, get 20% off all Grill & Fire mains.', bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200', discountLabel: '20% OFF', linkedPromoCode: 'WEEKEND20' },
  { _id: 'o2', title: 'First Order, Free Delivery', description: 'New here? Get free delivery on your first order.', bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200', discountLabel: 'WELCOME10' }
];

const SAMPLE_PROMO_CODES = [
  { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, maxDiscountAmount: 500, minOrderAmount: 0 },
  { code: 'WEEKEND20', discountType: 'percentage', discountValue: 20, maxDiscountAmount: 1000, minOrderAmount: 2000 },
  { code: 'FLAT300', discountType: 'fixed', discountValue: 300, minOrderAmount: 1500 }
];

const SAMPLE_SETTINGS = {
  restaurantName: 'Foundry & Flame',
  tagline: 'A modern wood-fired kitchen',
  whatsappNumber: '923294847025',
  contactNumber: '+92 3294847025',
  address: 'Plot 12, Khayaban-e-Ittehad, Karachi',
  businessHours: 'Mon–Sun, 12:00 PM – 11:30 PM',
  currencySymbol: 'Rs.',
  deliveryFee: 150,
  freeDeliveryThreshold: 3000
};

const SAMPLE_TESTIMONIALS = [
  { name: 'Ayesha K.', quote: "The half chicken tastes like it came off an actual campfire — genuinely the best delivery order in the city." },
  { name: 'Bilal R.', quote: "Ordered the tomahawk for a birthday. It arrived hot, perfectly rested, and the WhatsApp ordering was so easy." },
  { name: 'Sana M.', quote: "Smoked wings are unreal. I've tried all three flavors twice now — dry rub is unbeatable." },
  { name: 'Omar F.', quote: "Finally a place that doesn't taste like it was reheated. You can genuinely taste the smoke." }
];

const SAMPLE_FAQS = [
  { q: 'How fast is delivery?', a: 'Most orders arrive within 40–50 minutes, depending on distance and order volume during peak hours.' },
  { q: 'Do you cater events?', a: "Yes — send us a message via the contact form with your event size and date and we'll put together a package." },
  { q: 'Can I customize spice levels?', a: 'Absolutely, just add a note at checkout and the kitchen will adjust accordingly.' },
  { q: 'What payment methods do you accept?', a: 'Cash on Delivery for now. Card payments are coming soon.' },
  { q: 'Is there a minimum order for delivery?', a: 'No minimum, but orders under the free-delivery threshold include a standard delivery fee.' }
];

const SAMPLE_GALLERY = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800',
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=800',
  'https://images.unsplash.com/photo-1527477396000-e27163b481c2?q=80&w=800',
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800'
];

const WHY_CHOOSE_US = [
  { title: 'Real fire, every dish', desc: 'No shortcuts — everything is finished over live coals or wood.', icon: '🔥' },
  { title: '45-minute promise', desc: 'Hot, fresh, and on your table before the char cools.', icon: '⏱' },
  { title: 'Locally sourced', desc: 'Produce and meat sourced from trusted local suppliers daily.', icon: '🌿' }
];
