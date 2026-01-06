const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const {
  createWithdrawRequest,
  getMyWithdrawRequests,
  getWithdrawRequestDetail,
  cancelWithdrawRequest,
  getAllWithdrawRequests,
  reviewWithdrawRequest,
  getWithdrawStats
} = require('../controllers/withdraw.controller');

// 用户提现相关路由
router.post('/', protect, createWithdrawRequest);
router.get('/my', protect, getMyWithdrawRequests);
router.get('/stats', protect, getWithdrawStats);
router.get('/:id', protect, getWithdrawRequestDetail);
router.post('/:id/cancel', protect, cancelWithdrawRequest);

// 管理员提现审核路由
router.get('/admin/all', protect, requireAdmin, getAllWithdrawRequests);
router.post('/admin/:id/review', protect, requireAdmin, reviewWithdrawRequest);

module.exports = router;
