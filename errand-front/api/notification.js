const request = require('./request.js')

// 通知相关的API
const notificationAPI = {
  // 获取通知列表
  getNotifications(params = {}) {
    return request.get('/notifications', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      unreadOnly: params.unreadOnly || false
    })
  },

  // 获取未读通知数量
  getUnreadCount() {
    return request.get('/notifications/unread-count')
  },

  // 标记通知为已读
  markAsRead(notificationId) {
    return request.put(`/notifications/${notificationId}/read`)
  },

  // 标记所有通知为已读
  markAllAsRead() {
    return request.put('/notifications/read-all')
  },

  // 删除通知
  deleteNotification(notificationId) {
    return request.delete(`/notifications/${notificationId}`)
  }
}

module.exports = notificationAPI
