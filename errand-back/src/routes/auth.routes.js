const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  sendCode, 
  verifyCode, 
  logout 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);
router.post('/logout', protect, logout);

module.exports = router;
