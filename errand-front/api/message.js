const request = require('./request.js');

// 发送消息
function sendMessage(data) {
  return request.post('/messages/send', data);
}

// 获取订单聊天记录
function getOrderMessages(orderId) {
  return request.get(`/messages/order/${orderId}`);
}

// 获取聊天列表
function getChatList() {
  return request.get('/messages/chats');
}

// 获取未读消息数
function getUnreadCount() {
  return request.get('/messages/unread-count');
}

module.exports = {
  sendMessage,
  getOrderMessages,
  getChatList,
  getUnreadCount
};
