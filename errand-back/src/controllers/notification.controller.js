// 通知控制器 - 用于订单状态变更通知
const Notification = require('../models/Notification');

// 获取用户通知列表
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, unreadOnly = false } = req.query;

    const notifications = await Notification.findByUser(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      code: 0,
      data: notifications,
      message: '获取通知列表成功'
    });
  } catch (error) {
    next(error);
  }
};

// 标记通知为已读
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '通知不存在'
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限操作此通知'
      });
    }

    await Notification.markAsRead(id);

    res.json({
      success: true,
      code: 0,
      message: '标记成功'
    });
  } catch (error) {
    next(error);
  }
};

// 标记所有通知为已读
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      code: 0,
      message: '全部标记成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取未读通知数量
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      code: 0,
      data: { count },
      message: '获取未读数量成功'
    });
  } catch (error) {
    next(error);
  }
};

// 删除通知
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '通知不存在'
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限删除此通知'
      });
    }

    await Notification.delete(id);

    res.json({
      success: true,
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
