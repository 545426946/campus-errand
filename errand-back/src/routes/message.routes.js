const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth');

// 所有消息路由都需要认证
router.use(authenticate);

// 发送消息
router.post('/send', messageController.sendMessage);

// 获取订单的聊天记录
router.get('/order/:orderId', messageController.getOrderMessages);

// 获取聊天列表
router.get('/chats', messageController.getChatList);

// 获取未读消息数
router.get('/unread-count', messageController.getUnreadCount);

module.exports = router;
