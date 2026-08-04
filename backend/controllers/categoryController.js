const Category = require('../models/Category');

const slugify = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

exports.list = async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json(categories);
};

exports.create = async (req, res) => {
  const payload = { ...req.body };
  if (!payload.slug) payload.slug = slugify(payload.name || '');
  const category = await Category.create(payload);
  res.status(201).json(category);
};

exports.update = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json(category);
};

exports.remove = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json({ message: 'Category deleted.' });
};
