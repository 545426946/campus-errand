const request = require('./request.js')
const config = require('../utils/config.js')

// 订单相关的API
const orderAPI = {
  // 获取订单列表
  getOrderList(params = {}) {
    return request.get('/orders', {
      page: params.page || 1,
      pageSize: params.pageSize || config.pagination.defaultPageSize,
      status: params.status,
      type: params.type,
      keyword: params.keyword
    })
  },

  // 获取订单详情
  getOrderDetail(orderId) {
    return request.get(`/orders/${orderId}`)
  },

  // 创建订单
  createOrder(orderData) {
    return request.post('/orders', orderData)
  },

  // 更新订单
  updateOrder(orderId, orderData) {
    return request.put(`/orders/${orderId}`, orderData)
  },

  // 接单
  acceptOrder(orderId) {
    return request.post(`/orders/${orderId}/accept`)
  },

  // 取消订单
  cancelOrder(orderId, reason = '') {
    return request.post(`/orders/${orderId}/cancel`, { reason })
  },

  // 完成订单（接单者标记完成）
  completeOrder(orderId, data = {}) {
    return request.post(`/orders/${orderId}/complete`, data)
  },

  // 确认完成订单（发布者确认）
  confirmCompleteOrder(orderId) {
    return request.post(`/orders/${orderId}/confirm-complete`)
  },

  // 确认收货（订单发布者确认）
  confirmOrder(orderId, data = {}) {
    return request.post(`/orders/${orderId}/confirm`, data)
  },

  // 删除订单
  deleteOrder(orderId) {
    return request.delete(`/orders/${orderId}`)
  },

  // 获取我的发布订单
  getMyPublishOrders(params = {}) {
    return request.get('/orders/my-publish', {
      page: params.page || 1,
      pageSize: params.pageSize || config.pagination.defaultPageSize,
      status: params.status
    })
  },

  // 获取我的接受订单
  getMyAcceptedOrders(params = {}) {
    return request.get('/orders/my-accepted', {
      page: params.page || 1,
      pageSize: params.pageSize || config.pagination.defaultPageSize,
      status: params.status
    })
  },

  // 搜索订单
  searchOrders(keyword, params = {}) {
    return request.get('/orders/search', {
      keyword,
      page: params.page || 1,
      pageSize: params.pageSize || config.pagination.defaultPageSize,
      type: params.type,
      status: params.status
    })
  },

  // 获取全部订单
  getHotOrders(params = {}) {
    return request.get('/orders/hot', {
      limit: params.limit || 10
    })
  },

  // 获取推荐订单
  getRecommendedOrders(params = {}) {
    return request.get('/orders/recommended', {
      limit: params.limit || 10,
      location: params.location
    })
  },

  // 订单统计
  getOrderStats() {
    return request.get('/orders/stats')
  },

  // 订单评价
  evaluateOrder(orderId, evaluationData) {
    return request.post(`/orders/${orderId}/evaluate`, evaluationData)
  },

  // 获取订单评价
  getOrderEvaluations(orderId) {
    return request.get(`/orders/${orderId}/evaluations`)
  },

  // 举报订单
  reportOrder(orderId, reportData) {
    return request.post(`/orders/${orderId}/report`, reportData)
  },

  // 分享订单
  shareOrder(orderId) {
    return request.post(`/orders/${orderId}/share`)
  },

  // 请求取消订单（协商取消）
  requestCancelOrder(orderId, reason) {
    return request.post(`/orders/${orderId}/cancel-request`, { reason })
  },

  // 获取取消申请列表
  getCancelRequests(orderId) {
    return request.get(`/orders/${orderId}/cancel-requests`)
  },

  // 处理取消申请（同意/拒绝）
  handleCancelRequest(requestId, action, reply = '') {
    return request.post(`/cancel-requests/${requestId}/${action}`, { reply })
  }
}

module.exports = orderAPI