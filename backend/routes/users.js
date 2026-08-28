/*const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get user profile
router.get('/profile', async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.email;
    delete updates.role;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user penalties
router.get('/penalties', async (req, res) => {
  res.json({
    success: true,
    penalties: req.user.penalties  });
});

module.exports = router;
*/



// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user penalties
router.get('/penalties', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ 
      success: true, 
      penalties: user.penalties 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
