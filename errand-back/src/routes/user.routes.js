const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/profile', (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    const user = await require('../models/User').findByIdAndUpdate(
      req.user.id,
      { profile: updates },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
