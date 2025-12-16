const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 所有通知路由都需要认证
router.use(protect);

// 通知列表和统计
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// 标记已读
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

// 删除通知
router.delete('/:id', deleteNotification);

module.exports = router;
