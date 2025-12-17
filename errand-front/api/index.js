// API统一导出文件
const userAPI = require('./user.js')
const orderAPI = require('./order.js')
const notificationAPI = require('./notification.js')
const systemAPI = require('./system.js')
const uploadAPI = require('./upload.js')

module.exports = {
  user: userAPI,
  order: orderAPI,
  notification: notificationAPI,
  system: systemAPI,
  upload: uploadAPI
}
