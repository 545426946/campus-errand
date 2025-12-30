const express = require('express');
const {
  getOrders,
  getOrderDetail,
  createOrder,
  updateOrder,
  acceptOrder,
  cancelOrder,
  completeOrder,
  confirmCompleteOrder,
  confirmOrder,
  deleteOrder,
  getMyPublishOrders,
  getMyAcceptedOrders,
  getOrderStats
} = require('../controllers/order.controller');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 订单搜索和推荐（必须在 /:id 之前定义）
const { evaluateOrder, getEvaluations, reportOrder, shareOrder, searchOrders, getHotOrders, getRecommendedOrders } = require('../controllers/order.controller');

// 公开接口 - 不需要认证（未登录用户可以浏览）
router.get('/', getOrders);  // 订单列表
router.get('/search', searchOrders);  // 搜索订单
router.get('/hot', getHotOrders);  // 全部订单
router.get('/recommended', getRecommendedOrders);  // 推荐订单

// 我的订单 - 需要认证（必须在 /:id 之前）
router.get('/my-publish', protect, getMyPublishOrders);
router.get('/my-accepted', protect, getMyAcceptedOrders);
router.get('/stats', protect, getOrderStats);

// 订单详情 - 可选认证（登录用户可以看到更多信息）
router.get('/:id', optionalAuth, getOrderDetail);
router.get('/:id/evaluations', getEvaluations);  // 查看评价

// 需要认证的接口
router.post('/', protect, createOrder);  // 创建订单
router.put('/:id', protect, updateOrder);  // 更新订单
router.delete('/:id', protect, deleteOrder);  // 删除订单

// 订单状态操作 - 需要认证
router.post('/:id/accept', protect, acceptOrder);
router.post('/:id/cancel', protect, cancelOrder);
router.post('/:id/complete', protect, completeOrder);  // 接单者标记完成
router.post('/:id/confirm-complete', protect, confirmCompleteOrder);  // 发布者确认完成
router.post('/:id/confirm', protect, confirmOrder);

// 订单评价、举报、分享 - 需要认证
router.post('/:id/evaluate', protect, evaluateOrder);
router.post('/:id/report', protect, reportOrder);
router.post('/:id/share', protect, shareOrder);

module.exports = router;
