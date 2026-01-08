const Order = require('../models/Order');
const Notification = require('../models/Notification');

// 获取订单列表（大厅）- 只显示未完成的订单
exports.getOrders = async (req, res, next) => {
  try {
    const { page, pageSize, status, type, keyword } = req.query;

    const filters = {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      // 大厅默认只显示pending和accepted状态的订单，不显示completed和cancelled
      status: status || 'pending,accepted',
      type: type || '',
      keyword: keyword || ''
    };

    const orders = await Order.findAll(filters);

    res.json({
      success: true,
      code: 0,
      data: orders,
      message: '获取订单列表成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取订单详情
exports.getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null; // 支持未登录查看

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 隐私保护：只有发布者和接单者可以看到详细信息
    const isPublisher = userId && order.user_id === userId;
    const isAcceptor = userId && order.acceptor_id === userId;
    const canViewDetails = isPublisher || isAcceptor;

    // 如果不是发布者或接单者，隐藏敏感信息
    if (!canViewDetails) {
      order.pickup_location = '接单后可见';
      order.delivery_location = '接单后可见';
      order.contact_phone = '接单后可见';
      order.publisher_phone = null;
      order.acceptor_phone = null;
    }

    res.json({
      success: true,
      code: 0,
      data: order,
      message: '获取订单详情成功'
    });
  } catch (error) {
    next(error);
  }
};

// 创建订单
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const orderPrice = parseFloat(req.body.price) || 0;

    console.log('=== 创建订单调试 ===');
    console.log('用户ID:', userId);
    console.log('请求体:', JSON.stringify(req.body, null, 2));
    console.log('订单金额:', orderPrice, '(原始值:', req.body.price, ')');

    // 检查用户余额是否足够
    if (orderPrice > 0) {
      const balanceCheck = await User.checkBalance(userId, orderPrice);
      console.log('余额检查结果:', balanceCheck);
      
      if (!balanceCheck.sufficient) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: `余额不足，当前余额 ¥${balanceCheck.balance.toFixed(2)}，需要 ¥${balanceCheck.required.toFixed(2)}，还差 ¥${balanceCheck.shortage.toFixed(2)}`,
          data: {
            balance: balanceCheck.balance,
            required: balanceCheck.required,
            shortage: balanceCheck.shortage
          }
        });
      }
    }

    const orderData = {
      userId,
      ...req.body
    };

    // 创建订单
    const orderId = await Order.create(orderData);
    console.log('订单创建成功，ID:', orderId);

    // 冻结订单金额
    if (orderPrice > 0) {
      console.log('开始冻结金额...');
      try {
        const freezeResult = await User.freezeBalance(
          userId, 
          orderPrice, 
          orderId, 
          '发布订单冻结', 
          `发布订单"${req.body.title}"，冻结金额 ¥${orderPrice.toFixed(2)}`
        );
        console.log('冻结结果:', freezeResult);
      } catch (freezeError) {
        console.error('冻结失败:', freezeError);
        // 如果冻结失败，删除已创建的订单
        await Order.delete(orderId);
        return res.status(400).json({
          success: false,
          code: 400,
          message: '冻结金额失败: ' + freezeError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      code: 0,
      data: { orderId },
      message: '订单创建成功，金额已冻结'
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    next(error);
  }
};

// 更新订单
exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 只有订单发布者可以更新
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限更新此订单'
      });
    }

    const updated = await Order.update(id, req.body);

    if (!updated) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '订单更新失败'
      });
    }

    res.json({
      success: true,
      code: 0,
      message: '订单更新成功'
    });
  } catch (error) {
    next(error);
  }
};

// 接单
exports.acceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const acceptorId = req.user.id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    if (order.user_id === acceptorId) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '不能接受自己发布的订单'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '订单状态不允许接单'
      });
    }

    console.log('=== 接单调试信息 ===');
    console.log('订单ID:', id);
    console.log('接单者ID:', acceptorId);
    
    const accepted = await Order.accept(id, acceptorId);

    console.log('接单结果:', accepted);
    
    if (!accepted) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '接单失败'
      });
    }

    // 创建通知给订单发布者
    try {
      await Notification.createOrderNotification(
        id,
        order.user_id,
        'order_accepted',
        '订单已被接单',
        `您的订单"${order.title}"已被接单`
      );
    } catch (error) {
      console.error('创建通知失败:', error);
    }

    res.json({
      success: true,
      code: 0,
      message: '接单成功'
    });
  } catch (error) {
    next(error);
  }
};

// 取消订单
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 只有订单发布者或接单者可以取消
    if (order.user_id !== userId && order.acceptor_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限取消此订单'
      });
    }

    const cancelled = await Order.cancel(id, reason);

    if (!cancelled) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '取消订单失败'
      });
    }

    // 退还冻结金额给发布者
    const User = require('../models/User');
    const refundAmount = parseFloat(order.price) || 0;
    
    if (refundAmount > 0) {
      try {
        await User.unfreezeBalance(
          order.user_id,
          refundAmount,
          id,
          '订单取消退款',
          `订单"${order.title}"已取消，冻结金额 ¥${refundAmount.toFixed(2)} 已退还`
        );
      } catch (refundError) {
        console.error('退款失败:', refundError);
        // 退款失败不影响取消操作，但记录错误
      }
    }

    // 创建通知
    try {
      // 如果有接单者，通知接单者
      if (order.acceptor_id && order.acceptor_id !== userId) {
        await Notification.createOrderNotification(
          id,
          order.acceptor_id,
          'order_cancelled',
          '订单已取消',
          `订单"${order.title}"已被取消，原因：${reason}`
        );
      }
      // 如果是接单者取消，通知发布者
      if (order.acceptor_id === userId) {
        await Notification.createOrderNotification(
          id,
          order.user_id,
          'order_cancelled',
          '订单已取消',
          `您的订单"${order.title}"已被取消，原因：${reason}，冻结金额已退还`
        );
      }
    } catch (error) {
      console.error('创建通知失败:', error);
    }

    res.json({
      success: true,
      code: 0,
      message: '订单已取消，冻结金额已退还'
    });
  } catch (error) {
    next(error);
  }
};

// 接单者标记完成订单（进入待确认状态）
exports.completeOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 只有接单者可以标记完成
    if (order.acceptor_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限完成此订单'
      });
    }

    const completed = await Order.markCompleting(id);

    if (!completed) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '标记完成失败'
      });
    }

    // 创建通知给订单发布者
    try {
      await Notification.createOrderNotification(
        id,
        order.user_id,
        'order_completing',
        '订单待确认',
        `接单者已完成订单"${order.title}"，请确认`
      );
    } catch (error) {
      console.error('创建通知失败:', error);
    }

    res.json({
      success: true,
      code: 0,
      message: '已标记完成，等待发布者确认'
    });
  } catch (error) {
    next(error);
  }
};

// 发布者确认完成订单
exports.confirmCompleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('=== 确认完成订单调试 ===');
    console.log('订单ID:', id);
    console.log('用户ID:', userId);

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    console.log('订单信息:', {
      user_id: order.user_id,
      acceptor_id: order.acceptor_id,
      price: order.price,
      status: order.status
    });

    // 只有发布者可以确认完成
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限确认此订单'
      });
    }

    // 订单必须是待确认状态
    if (order.status !== 'completing') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '订单状态不允许确认'
      });
    }

    const confirmed = await Order.confirmComplete(id);

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '确认完成失败'
      });
    }

    // 将冻结金额转给骑手
    const User = require('../models/User');
    const paymentAmount = parseFloat(order.price) || 0;
    
    console.log('支付金额:', paymentAmount);
    console.log('骑手ID:', order.acceptor_id);

    if (paymentAmount > 0 && order.acceptor_id) {
      console.log('开始转账...');
      try {
        const transferResult = await User.unfreezeAndTransfer(
          userId,            // 发布者ID
          order.acceptor_id, // 骑手ID
          paymentAmount,
          id,
          order.title
        );
        console.log('转账结果:', transferResult);
      } catch (transferError) {
        console.error('转账失败:', transferError);
        // 返回错误信息但不影响订单状态
        return res.json({
          success: true,
          code: 0,
          message: '订单已确认完成，但转账失败: ' + transferError.message
        });
      }
    } else {
      console.log('跳过转账: paymentAmount=', paymentAmount, 'acceptor_id=', order.acceptor_id);
    }

    // 创建通知给接单者
    try {
      await Notification.createOrderNotification(
        id,
        order.acceptor_id,
        'order_confirmed',
        '订单已确认完成',
        `发布者已确认订单"${order.title}"完成，¥${paymentAmount.toFixed(2)}已到账`
      );
    } catch (error) {
      console.error('创建通知失败:', error);
    }

    res.json({
      success: true,
      code: 0,
      message: '订单已确认完成，款项已支付给骑手'
    });
  } catch (error) {
    console.error('确认完成订单错误:', error);
    next(error);
  }
};

// 确认订单（发布者确认）
exports.confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 只有订单发布者可以确认
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限确认此订单'
      });
    }

    res.json({
      success: true,
      code: 0,
      message: '订单已确认'
    });
  } catch (error) {
    next(error);
  }
};

// 删除订单
exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 只有订单发布者可以删除
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限删除此订单'
      });
    }

    const deleted = await Order.delete(id);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '删除订单失败'
      });
    }

    res.json({
      success: true,
      code: 0,
      message: '订单已删除'
    });
  } catch (error) {
    next(error);
  }
};

// 获取我发布的订单
exports.getMyPublishOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, pageSize, status } = req.query;

    console.log('=== getMyPublishOrders 调试 ===');
    console.log('用户ID:', userId, '类型:', typeof userId);
    console.log('查询参数:', { page, pageSize, status });

    const orders = await Order.findByPublisher(userId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      status
    });

    console.log('查询结果数量:', orders.length);
    console.log('订单数据:', orders);

    res.json({
      success: true,
      code: 0,
      data: orders,
      message: '获取发布订单成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取我接受的订单
exports.getMyAcceptedOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, pageSize, status } = req.query;

    console.log('=== getMyAcceptedOrders 调试 ===');
    console.log('用户ID:', userId, '类型:', typeof userId);
    console.log('查询参数:', { page, pageSize, status });

    const orders = await Order.findByAcceptor(userId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      status
    });

    console.log('查询结果数量:', orders.length);
    console.log('订单数据:', orders);

    res.json({
      success: true,
      code: 0,
      data: orders,
      message: '获取接受订单成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取订单统计
exports.getOrderStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stats = await Order.getStats(userId);

    res.json({
      success: true,
      code: 0,
      data: stats,
      message: '获取订单统计成功'
    });
  } catch (error) {
    next(error);
  }
};

// 评价订单
exports.evaluateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment, tags } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 只有订单发布者可以评价
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限评价此订单'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '评分必须在1-5之间'
      });
    }

    // 简化版：直接返回成功
    res.json({
      success: true,
      code: 0,
      message: '评价成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取订单评价
exports.getEvaluations = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 简化版：返回空列表
    res.json({
      success: true,
      code: 0,
      data: {
        list: [],
        total: 0
      },
      message: '获取评价成功'
    });
  } catch (error) {
    next(error);
  }
};

// 举报订单
exports.reportOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供举报原因'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 简化版：直接返回成功
    console.log(`用户 ${userId} 举报订单 ${id}，原因：${reason}`);

    res.json({
      success: true,
      code: 0,
      message: '举报已提交'
    });
  } catch (error) {
    next(error);
  }
};

// 分享订单
exports.shareOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 生成分享信息
    res.json({
      success: true,
      code: 0,
      data: {
        title: order.title,
        description: order.description,
        imageUrl: order.images ? order.images[0] : '',
        path: `/pages/order/detail?id=${id}`
      },
      message: '获取分享信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 搜索订单
exports.searchOrders = async (req, res, next) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供搜索关键词'
      });
    }

    const orders = await Order.search(keyword, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    res.json({
      success: true,
      code: 0,
      data: orders,
      message: '搜索成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取全部订单
exports.getHotOrders = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    const orders = await Order.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      orderBy: 'created_at DESC'
    });

    res.json({
      success: true,
      code: 0,
      data: orders,
      message: '获取全部订单成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取推荐订单
exports.getRecommendedOrders = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    const orders = await Order.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status: 'pending',
      orderBy: 'created_at DESC'
    });

    res.json({
      success: true,
      code: 0,
      data: orders,
      message: '获取推荐订单成功'
    });
  } catch (error) {
    next(error);
  }
};
