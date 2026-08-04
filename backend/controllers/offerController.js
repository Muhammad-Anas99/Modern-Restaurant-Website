const Offer = require('../models/Offer');

exports.list = async (req, res) => {
  const { activeOnly } = req.query;
  const filter = {};
  if (activeOnly === 'true') {
    const now = new Date();
    filter.active = true;
    filter.startsAt = { $lte: now };
    filter.expiresAt = { $gte: now };
  }
  const offers = await Offer.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  res.json(offers);
};

exports.create = async (req, res) => {
  const offer = await Offer.create(req.body);
  res.status(201).json(offer);
};

exports.update = async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!offer) return res.status(404).json({ message: 'Offer not found.' });
  res.json(offer);
};

exports.remove = async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) return res.status(404).json({ message: 'Offer not found.' });
  res.json({ message: 'Offer deleted.' });
};
