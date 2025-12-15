const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(protect);

router.get('/profile', (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/profile', async (req, res) => {
  try {
    const user = await User.updateProfile(req.user.id, req.body);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/learning-progress', async (req, res) => {
  try {
    const progress = await User.getLearningProgress(req.user.id);
    res.json({ success: true, progress });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
