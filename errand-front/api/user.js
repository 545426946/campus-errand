const request = require('./request.js')

// 用户相关的API
const userAPI = {
  // 用户注册
  register(username, password, confirmPassword) {
    return request.post('/auth/register', { 
      username, 
      password, 
      confirmPassword 
    })
  },

  // 账号密码登录
  accountLogin(username, password) {
    return request.post('/auth/login', { 
      username, 
      password 
    })
  },

  // 微信登录（标准流程）
  wechatLogin(code, userInfo = null) {
    return request.post('/auth/wechat/login', { 
      code,
      nickname: userInfo?.nickName || null,
      avatar: userInfo?.avatarUrl || null
    })
  },

  // 旧版微信登录（兼容）
  login(code) {
    return request.post('/auth/login', { code })
  },

  // 绑定微信手机号
  bindWechatPhone(encryptedData, iv) {
    return request.post('/auth/wechat/bind-phone', {
      encryptedData,
      iv
    })
  },

  // 获取用户信息 (同 getUserProfile)
  getUserInfo() {
    return request.get('/user/profile')
  },

  // 更新用户信息 (基础信息)
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

  // 创建提现申请
  createWithdrawRequest(withdrawData) {
    return request.post('/withdraw', withdrawData)
  },

  // 获取我的提现申请列表
  getMyWithdrawRequests(params = {}) {
    return request.get('/withdraw/my', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      status: params.status
    })
  },

  // 获取提现申请详情
  getWithdrawRequestDetail(id) {
    return request.get(`/withdraw/${id}`)
  },

  // 取消提现申请
  cancelWithdrawRequest(id) {
    return request.post(`/withdraw/${id}/cancel`)
  },

  // 获取提现统计
  getWithdrawStats() {
    return request.get('/withdraw/stats')
  },

  // 获取用户统计数据
  getUserStats() {
    return request.get('/user/stats')
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
  },

  // 删除历史记录（单条）
  deleteHistoryItem(id) {
    return request.delete(`/user/history/${id}`)
  }
}

module.exports = userAPI