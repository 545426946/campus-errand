const request = require('./request.js')

// 用户相关的API
const userAPI = {
  // 用户登录
  login(code) {
    return request.post('/auth/login', { code })
  },

  // 获取用户信息
  getUserInfo() {
    return request.get('/users/profile')
  },

  // 更新用户信息
  updateUserInfo(userInfo) {
    return request.put('/user/info', userInfo)
  },

  // 获取用户头像
  getUserAvatar() {
    return request.get('/user/avatar')
  },

  // 更新用户头像
  updateUserAvatar(filePath) {
    return request.uploadFile('/user/avatar', filePath, {}, {
      name: 'avatar',
      loadingText: '上传头像中...'
    })
  },

  // 获取用户资料
  getUserProfile() {
    return request.get('/user/profile')
  },

  // 更新用户资料
  updateUserProfile(profileData) {
    return request.put('/user/profile', profileData)
  },

  // 实名认证
  certifyUser(certificationData) {
    return request.post('/user/certify', certificationData)
  },

  // 获取认证状态
  getCertificationStatus() {
    return request.get('/user/certification/status')
  },

  // 获取认证信息
  getCertificationInfo() {
    return request.get('/user/certification/info')
  },

  // 修改密码
  changePassword(passwordData) {
    return request.post('/user/change-password', passwordData)
  },

  // 重置密码
  resetPassword(resetData) {
    return request.post('/user/reset-password', resetData)
  },

  // 绑定手机号
  bindPhone(phoneData) {
    return request.post('/user/bind-phone', phoneData)
  },

  // 发送验证码
  sendVerificationCode(phone, type = 'login') {
    return request.post('/auth/send-code', { phone, type })
  },

  // 验证验证码
  verifyCode(phone, code, type = 'login') {
    return request.post('/auth/verify-code', { phone, code, type })
  },

  // 退出登录
  logout() {
    return request.post('/auth/logout')
  },

  // 获取用户钱包信息
  getWalletInfo() {
    return request.get('/user/wallet')
  },

  // 获取钱包明细
  getWalletDetails(params = {}) {
    return request.get('/user/wallet/details', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      type: params.type
    })
  },

  // 提现
  withdraw(withdrawData) {
    return request.post('/user/wallet/withdraw', withdrawData)
  },

  // 充值
  recharge(rechargeData) {
    return request.post('/user/wallet/recharge', rechargeData)
  },

  // 获取用户统计数据
  getUserStats() {
    return request.get('/user/stats')
  },

  // 获取收藏列表
  getFavoriteList(params = {}) {
    return request.get('/user/favorites', {
      page: params.page || 1,
      pageSize: params.pageSize || 20
    })
  },

  // 添加收藏
  addToFavorite(orderId) {
    return request.post('/user/favorites', { orderId })
  },

  // 取消收藏
  removeFromFavorite(orderId) {
    return request.delete(`/user/favorites/${orderId}`)
  },

  // 获取历史记录
  getHistory(params = {}) {
    return request.get('/user/history', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      type: params.type
    })
  },

  // 清空历史记录
  clearHistory(type) {
    return request.delete('/user/history', { type })
  },

  // 获取用户设置
  getUserSettings() {
    return request.get('/user/settings')
  },

  // 更新用户设置
  updateUserSettings(settings) {
    return request.put('/user/settings', settings)
  },

  // 删除账号
  deleteAccount(password) {
    return request.delete('/user/account', { password })
  }
}

module.exports = userAPI