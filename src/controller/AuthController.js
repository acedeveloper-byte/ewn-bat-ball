// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mockUser = {
  email: 'test@example.com',
  passwordHash: bcrypt.hashSync('password123', 10),
  id: 1,
};

const generateAuthCode = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (email !== mockUser.email) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, mockUser.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateAuthCode(mockUser.id);
  return res.json({ message: 'Login successful', authCode: token });
};

module.exports = {
  login,
};
