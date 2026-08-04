const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.active) return res.status(401).json({ message: 'Invalid email or password.' });

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

exports.me = async (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
};
