const request = require('./request.js')

// 通用API
const commonAPI = {
  // 获取系统配置
  getSystemConfig() {
    return request.get('/system/config')
  },

  // 获取服务类型列表
  getServiceTypes() {
    return request.get('/system/service-types')
  },

  // 上传图片
  uploadImage(filePath, options = {}) {
    return request.uploadFile('/upload/image', filePath, {
      category: options.category || 'general'
    }, {
      name: 'image',
      loadingText: '上传图片中...'
    })
  },

  // 批量上传图片
  uploadImages(filePaths, options = {}) {
    const uploadPromises = filePaths.map(filePath => 
      this.uploadImage(filePath, options)
    )
    return Promise.all(uploadPromises)
  },

  // 获取位置信息
  getLocationInfo(lat, lng) {
    return request.get('/system/location', { lat, lng })
  },

  // 搜索地点
  searchLocation(keyword, params = {}) {
    return request.get('/system/search-location', {
      keyword,
      city: params.city,
      limit: params.limit || 10
    })
  },

  // 获取天气信息
  getWeatherInfo(location) {
    return request.get('/system/weather', { location })
  },

  // 意见反馈
  submitFeedback(feedbackData) {
    return request.post('/system/feedback', feedbackData)
  },

  // 获取反馈历史
  getFeedbackHistory(params = {}) {
    return request.get('/system/feedback/history', {
      page: params.page || 1,
      pageSize: params.pageSize || 20
    })
  },

  // 获取帮助信息
  getHelpList(params = {}) {
    return request.get('/system/help', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      category: params.category
    })
  },

  // 获取帮助详情
  getHelpDetail(helpId) {
    return request.get(`/system/help/${helpId}`)
  },

  // 获取关于我们信息
  getAboutInfo() {
    return request.get('/system/about')
  },

  // 获取隐私政策
  getPrivacyPolicy() {
    return request.get('/system/privacy')
  },

  // 获取用户协议
  getUserAgreement() {
    return request.get('/system/agreement')
  },

  // 获取版本信息
  getVersionInfo() {
    return request.get('/system/version')
  },

  // 检查更新
  checkUpdate(currentVersion) {
    return request.post('/system/check-update', { currentVersion })
  },

  // 发送分享统计
  sendShareStats(shareData) {
    return request.post('/system/share-stats', shareData)
  },

  // 获取公告列表
  getAnnouncements(params = {}) {
    return request.get('/system/announcements', {
      page: params.page || 1,
      pageSize: params.pageSize || 20
    })
  },

  // 获取公告详情
  getAnnouncementDetail(announcementId) {
    return request.get(`/system/announcements/${announcementId}`)
  },

  // 获取热门搜索
  getHotSearch() {
    return request.get('/system/hot-search')
  },

  // 获取推荐关键词
  getRecommendedKeywords(type) {
    return request.get('/system/recommended-keywords', { type })
  },

  // 检查敏感词
  checkSensitiveWords(text) {
    return request.post('/system/check-sensitive', { text })
  },

  // 获取举报类型
  getReportTypes() {
    return request.get('/system/report-types')
  },

  // 提交举报
  submitReport(reportData) {
    return request.post('/system/report', reportData)
  }
}

module.exports = commonAPI