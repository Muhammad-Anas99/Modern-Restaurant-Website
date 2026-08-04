const PromoCode = require('../models/PromoCode');

exports.list = async (req, res) => {
  const codes = await PromoCode.find().sort({ createdAt: -1 });
  res.json(codes);
};

exports.create = async (req, res) => {
  const payload = { ...req.body, code: (req.body.code || '').toUpperCase() };
  const code = await PromoCode.create(payload);
  res.status(201).json(code);
};

exports.update = async (req, res) => {
  const code = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!code) return res.status(404).json({ message: 'Promo code not found.' });
  res.json(code);
};

exports.remove = async (req, res) => {
  const code = await PromoCode.findByIdAndDelete(req.params.id);
  if (!code) return res.status(404).json({ message: 'Promo code not found.' });
  res.json({ message: 'Promo code deleted.' });
};

// Public: called from checkout when a customer applies a promo code.
exports.validate = async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || subtotal == null) return res.status(400).json({ message: 'Code and subtotal are required.' });

  const promo = await PromoCode.findOne({ code: code.toUpperCase() });
  if (!promo) return res.status(404).json({ valid: false, reason: 'That promo code does not exist.' });

  const result = promo.computeDiscount(subtotal);
  res.json(result);
};
