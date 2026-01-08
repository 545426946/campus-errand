const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createRechargeOrder,
  wechatPayNotify,
  queryRechargeOrder,
  mockPaySuccess,
  getRechargeList
} = require('../controllers/recharge.controller');

const router = express.Router();

// 微信支付回调（不需要认证）
router.post('/notify', wechatPayNotify);

// 以下接口需要认证
router.use(protect);

// 创建充值订单
router.post('/create', createRechargeOrder);

// 查询订单状态
router.get('/query/:orderNo', queryRechargeOrder);

// 获取充值记录
router.get('/list', getRechargeList);

// 模拟支付成功（仅开发环境）
router.post('/mock-pay', mockPaySuccess);

module.exports = router;
