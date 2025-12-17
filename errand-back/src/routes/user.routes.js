const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserInfo,
  updateUserProfile,
  getLearningProgress,
  getWalletInfo,
  getWalletDetails,
  withdraw,
  recharge,
  getFavorites,
  addFavorite,
  removeFavorite,
  getHistory,
  deleteHistory,
  submitCertification,
  getCertificationStatus,
  getCertificationInfo,
  getAvatar,
  updateAvatar
} = require('../controllers/user.controller');

const router = express.Router();

// 所有用户路由都需要认证
router.use(protect);

// 用户信息
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/info', updateUserInfo);

// 头像
router.get('/avatar', getAvatar);
router.post('/avatar', updateAvatar);

// 实名认证
router.post('/certify', submitCertification);
router.get('/certification/status', getCertificationStatus);
router.get('/certification/info', getCertificationInfo);

// 钱包功能
router.get('/wallet', getWalletInfo);
router.get('/wallet/details', getWalletDetails);
router.post('/wallet/withdraw', withdraw);
router.post('/wallet/recharge', recharge);

// 收藏
router.get('/favorites', getFavorites);
router.post('/favorites', addFavorite);
router.delete('/favorites/:id', removeFavorite);

// 历史记录
router.get('/history', getHistory);
router.delete('/history/:id', deleteHistory);

// 学习进度
router.get('/learning-progress', getLearningProgress);

module.exports = router;
