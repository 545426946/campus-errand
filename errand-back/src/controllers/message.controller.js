const Message = require('../models/Message');
const Order = require('../models/Order');

// 发送消息
exports.sendMessage = async (req, res) => {
  try {
    const { orderId, receiverId, content, type = 'text' } = req.body;
    const senderId = req.user.id;

    console.log('发送消息请求:', { orderId, senderId, receiverId, content, type });
    console.log('类型检查 - senderId:', senderId, typeof senderId);
    console.log('类型检查 - receiverId:', receiverId, typeof receiverId);
    console.log('转换后比较:', parseInt(senderId), '===', parseInt(receiverId), '结果:', parseInt(senderId) === parseInt(receiverId));

    // 验证必填字段
    if (!orderId || !receiverId || !content) {
      return res.status(400).json({
        code: 1,
        message: '缺少必填字段'
      });
    }

    // 验证发送者和接收者不能相同
    if (parseInt(senderId) === parseInt(receiverId)) {
      console.error('发送者和接收者相同！senderId:', senderId, 'receiverId:', receiverId);
      return res.status(400).json({
        code: 1,
        message: '不能给自己发送消息'
      });
    }

    // 验证订单存在
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        code: 1,
        message: '订单不存在'
      });
    }

    // 验证用户是订单的参与者
    const isPublisher = parseInt(order.user_id) === parseInt(senderId);
    const isAcceptor = parseInt(order.acceptor_id) === parseInt(senderId);
    
    if (!isPublisher && !isAcceptor) {
      return res.status(403).json({
        code: 1,
        message: '您不是该订单的参与者'
      });
    }

    // 验证接收者是订单的另一方
    const validReceiver = (isPublisher && parseInt(order.acceptor_id) === parseInt(receiverId)) ||
                         (isAcceptor && parseInt(order.user_id) === parseInt(receiverId));
    
    if (!validReceiver) {
      return res.status(400).json({
        code: 1,
        message: '接收者必须是订单的另一方参与者'
      });
    }

    // 创建消息
    const messageId = await Message.create({
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      type
    });

    console.log('消息创建成功:', messageId);

    res.json({
      code: 0,
      message: '发送成功',
      data: { id: messageId }
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      code: 1,
      message: '发送消息失败',
      error: error.message
    });
  }
};

// 获取订单的聊天记录
exports.getOrderMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log('获取订单消息:', { orderId, userId });

    // 验证订单存在
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        code: 1,
        message: '订单不存在'
      });
    }

    // 验证用户是订单的参与者
    const isPublisher = parseInt(order.user_id) === parseInt(userId);
    const isAcceptor = parseInt(order.acceptor_id) === parseInt(userId);
    
    if (!isPublisher && !isAcceptor) {
      return res.status(403).json({
        code: 1,
        message: '您不是该订单的参与者'
      });
    }

    // 获取消息列表
    const messages = await Message.getByOrderId(orderId);

    // 标记消息为已读
    await Message.markAsRead(orderId, userId);

    console.log(`获取到 ${messages.length} 条消息`);

    res.json({
      code: 0,
      data: messages
    });
  } catch (error) {
    console.error('获取消息失败:', error);
    res.status(500).json({
      code: 1,
      message: '获取消息失败',
      error: error.message
    });
  }
};

// 获取聊天列表
exports.getChatList = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('获取聊天列表:', userId);

    const chatList = await Message.getChatListByUserId(userId);

    console.log(`获取到 ${chatList.length} 个聊天会话`);

    res.json({
      code: 0,
      data: chatList
    });
  } catch (error) {
    console.error('获取聊天列表失败:', error);
    res.status(500).json({
      code: 1,
      message: '获取聊天列表失败',
      error: error.message
    });
  }
};

// 获取未读消息数
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.getUnreadCount(userId);

    res.json({
      code: 0,
      data: { count }
    });
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    res.status(500).json({
      code: 1,
      message: '获取未读消息数失败',
      error: error.message
    });
  }
};
