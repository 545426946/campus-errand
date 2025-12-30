const express = require('express');
const router = express.Router();
const cancelRequestController = require('../controllers/cancelRequest.controller');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 创建取消请求
router.post('/orders/:orderId/cancel-request', cancelRequestController.createCancelRequest);

// 获取取消请求详情
router.get('/orders/:orderId/cancel-request', cancelRequestController.getCancelRequest);

// 处理取消请求（同意或拒绝）
router.post('/orders/:orderId/cancel-request/handle', cancelRequestController.handleCancelRequest);

module.exports = router;
