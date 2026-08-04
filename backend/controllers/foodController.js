const Food = require('../models/Food');

exports.list = async (req, res) => {
  const { category, search, featured, popular, available } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (popular === 'true') filter.isPopular = true;
  if (available === 'true') filter.isAvailable = true;
  if (search) filter.$text = { $search: search };

  const foods = await Food.find(filter).populate('category', 'name slug').sort({ createdAt: -1 });
  res.json(foods);
};

exports.getOne = async (req, res) => {
  const food = await Food.findById(req.params.id).populate('category', 'name slug');
  if (!food) return res.status(404).json({ message: 'Food item not found.' });
  res.json(food);
};

exports.create = async (req, res) => {
  const food = await Food.create(req.body);
  res.status(201).json(food);
};

exports.update = async (req, res) => {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!food) return res.status(404).json({ message: 'Food item not found.' });
  res.json(food);
};

exports.remove = async (req, res) => {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) return res.status(404).json({ message: 'Food item not found.' });
  res.json({ message: 'Food item deleted.' });
};
