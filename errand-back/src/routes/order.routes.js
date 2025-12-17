const express = require('express');
const {
  getOrders,
  getOrderDetail,
  createOrder,
  updateOrder,
  acceptOrder,
  cancelOrder,
  completeOrder,
  confirmOrder,
  deleteOrder,
  getMyPublishOrders,
  getMyAcceptedOrders,
  getOrderStats
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 所有订单路由都需要认证
router.use(protect);

// 订单列表和创建
router.get('/', getOrders);
router.post('/', createOrder);

// 我的订单
router.get('/my-publish', getMyPublishOrders);
router.get('/my-accepted', getMyAcceptedOrders);
router.get('/stats', getOrderStats);

// 订单详情和操作
router.get('/:id', getOrderDetail);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

// 订单状态操作
router.post('/:id/accept', acceptOrder);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/complete', completeOrder);
router.post('/:id/confirm', confirmOrder);

// 订单评价、举报、分享
const { evaluateOrder, getEvaluations, reportOrder, shareOrder, searchOrders, getHotOrders, getRecommendedOrders } = require('../controllers/order.controller');
router.post('/:id/evaluate', evaluateOrder);
router.get('/:id/evaluations', getEvaluations);
router.post('/:id/report', reportOrder);
router.post('/:id/share', shareOrder);

// 订单搜索和推荐
router.get('/search', searchOrders);
router.get('/hot', getHotOrders);
router.get('/recommended', getRecommendedOrders);

module.exports = router;
