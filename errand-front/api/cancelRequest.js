const request = require('./request.js');

// 创建取消请求
function createCancelRequest(orderId, reason) {
  return request.post(`/orders/${orderId}/cancel-request`, { reason });
}

// 获取取消请求详情
function getCancelRequest(orderId) {
  return request.get(`/orders/${orderId}/cancel-request`);
}

// 处理取消请求（同意或拒绝）
function handleCancelRequest(orderId, action) {
  return request.post(`/orders/${orderId}/cancel-request/handle`, { action });
}

module.exports = {
  createCancelRequest,
  getCancelRequest,
  handleCancelRequest
};
