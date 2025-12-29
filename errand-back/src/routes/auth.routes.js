const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  sendCode, 
  verifyCode, 
  logout,
  wechatLogin,
  bindPhone
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 账号密码登录/注册
router.post('/register', register);
router.post('/login', login);

// 微信登录
router.post('/wechat/login', wechatLogin);
router.post('/wechat/bind-phone', protect, bindPhone);

// 其他接口
router.get('/me', protect, getMe);
router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);
router.post('/logout', protect, logout);

module.exports = router;
