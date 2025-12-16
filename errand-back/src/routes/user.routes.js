const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserInfo,
  updateUserProfile,
  getLearningProgress,
  getWalletInfo
} = require('../controllers/user.controller');

const router = express.Router();

// 所有用户路由都需要认证
router.use(protect);

// 用户信息
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// 更新用户信息（兼容前端 /api/user/info）
router.put('/info', updateUserInfo);

// 钱包信息
router.get('/wallet', getWalletInfo);

// 学习进度
router.get('/learning-progress', getLearningProgress);

module.exports = router;
