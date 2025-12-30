const CancelRequest = require('../models/CancelRequest');
const Order = require('../models/Order');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

exports.createCancelRequest = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const requesterId = req.user.id;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, code: 404, message: '订单不存在' });
    }

    // 验证权限：发布者或接单者都可以发起取消请求
    if (order.user_id !== requesterId && order.acceptor_id !== requesterId) {
      return res.status(403).json({ success: false, code: 403, message: '权限不足' });
    }

    if (order.status !== 'accepted') {
      return res.status(400).json({ success: false, code: 400, message: '订单状态不允许发起取消请求' });
    }

    const existingRequest = await CancelRequest.findByOrderId(orderId);
    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(400).json({ success: false, code: 400, message: '已有待处理的取消请求' });
    }

    // 确定请求者身份和接收者
    const isPublisher = order.user_id === requesterId;
    const receiverId = isPublisher ? order.acceptor_id : order.user_id;
    const requesterRole = isPublisher ? '发布者' : '接单者';
    const defaultReason = `${requesterRole}请求取消订单`;

    const requestId = await CancelRequest.create({ order_id: orderId, requester_id: requesterId, reason: reason || defaultReason });

    await Message.create({ order_id: orderId, sender_id: requesterId, receiver_id: receiverId, content: `[取消请求] ${reason || defaultReason + '，请在订单详情中处理'}`, type: 'system' });

    try {
      await Notification.createOrderNotification(orderId, receiverId, 'cancel_request', '收到取消请求', `${requesterRole}请求取消订单"${order.title}"，原因：${reason || '无'}`);
    } catch (error) {
      console.error('创建通知失败:', error);
    }

    res.json({ success: true, code: 0, data: { requestId }, message: '取消请求已发送' });
  } catch (error) {
    next(error);
  }
};

exports.getCancelRequest = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, code: 404, message: '订单不存在' });
    }

    if (order.user_id !== userId && order.acceptor_id !== userId) {
      return res.status(403).json({ success: false, code: 403, message: '无权限查看此取消请求' });
    }

    const cancelRequest = await CancelRequest.findByOrderId(orderId);
    res.json({ success: true, code: 0, data: cancelRequest, message: '获取取消请求成功' });
  } catch (error) {
    next(error);
  }
};

exports.handleCancelRequest = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { action } = req.body;

    if (!['agree', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, code: 400, message: '无效的操作' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, code: 404, message: '订单不存在' });
    }

    const cancelRequest = await CancelRequest.findByOrderId(orderId);
    if (!cancelRequest) {
      return res.status(404).json({ success: false, code: 404, message: '取消请求不存在' });
    }

    // 验证权限：只有非请求方可以处理取消请求
    if (cancelRequest.requester_id === userId) {
      return res.status(403).json({ success: false, code: 403, message: '不能处理自己发起的取消请求' });
    }

    // 确保当前用户是订单相关方
    if (order.user_id !== userId && order.acceptor_id !== userId) {
      return res.status(403).json({ success: false, code: 403, message: '权限不足' });
    }

    if (cancelRequest.status !== 'pending') {
      return res.status(400).json({ success: false, code: 400, message: '该取消请求已被处理' });
    }

    // 确定处理者身份
    const isPublisher = order.user_id === userId;
    const handlerRole = isPublisher ? '发布者' : '接单者';
    const receiverId = cancelRequest.requester_id;

    let success = false;
    let message = '';

    if (action === 'agree') {
      success = await CancelRequest.agree(cancelRequest.id);
      if (success) {
        await Order.cancel(orderId, cancelRequest.reason);
        message = '已同意取消请求，订单已取消';
        await Message.create({ order_id: orderId, sender_id: userId, receiver_id: receiverId, content: `[取消请求已同意] ${handlerRole}已同意取消订单`, type: 'system' });
        try {
          await Notification.createOrderNotification(orderId, receiverId, 'cancel_agreed', '取消请求已同意', `${handlerRole}已同意取消订单"${order.title}"`);
        } catch (error) {
          console.error('创建通知失败:', error);
        }
      }
    } else {
      success = await CancelRequest.reject(cancelRequest.id);
      if (success) {
        message = '已拒绝取消请求';
        await Message.create({ order_id: orderId, sender_id: userId, receiver_id: receiverId, content: `[取消请求已拒绝] ${handlerRole}已拒绝取消订单，请继续完成订单`, type: 'system' });
        try {
          await Notification.createOrderNotification(orderId, receiverId, 'cancel_rejected', '取消请求已拒绝', `${handlerRole}已拒绝取消订单"${order.title}"，请继续完成订单`);
        } catch (error) {
          console.error('创建通知失败:', error);
        }
      }
    }

    if (!success) {
      return res.status(400).json({ success: false, code: 400, message: '处理取消请求失败' });
    }

    res.json({ success: true, code: 0, message });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
