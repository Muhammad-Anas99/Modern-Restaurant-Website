const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `FF-${stamp}-${rand}`;
}

// Public: created from the checkout page.
exports.create = async (req, res) => {
  const { customerName, phone, address, notes, items, subtotal, discount, promoCode, deliveryFee, tax, grandTotal } =
    req.body;

  if (!customerName || !phone || !address || !items?.length) {
    return res.status(400).json({ message: 'Missing required order details.' });
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customerName,
    phone,
    address,
    notes,
    items,
    subtotal,
    discount: discount || 0,
    promoCode: promoCode || null,
    deliveryFee: deliveryFee || 0,
    tax: tax || 0,
    grandTotal
  });

  if (promoCode) {
    await PromoCode.findOneAndUpdate({ code: promoCode.toUpperCase() }, { $inc: { usageCount: 1 } });
  }

  res.status(201).json(order);
};

// Admin: list all orders, optionally filtered by status.
exports.list = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
};

exports.getOne = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!Order.STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
};

exports.stats = async (req, res) => {
  const [totalOrders, pendingOrders, totalFoods] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    require('../models/Food').countDocuments()
  ]);
  const revenueAgg = await Order.aggregate([
    { $match: { status: { $in: ['Delivered', 'Completed'] } } },
    { $group: { _id: null, total: { $sum: '$grandTotal' } } }
  ]);
  res.json({
    totalOrders,
    pendingOrders,
    totalFoods,
    totalRevenue: revenueAgg[0]?.total || 0
  });
};
