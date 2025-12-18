const request = require('./request.js')

// 系统相关的API
const systemAPI = {
  getConfig() {
    return request.get('/system/config')
  },

  getServiceTypes() {
    return request.get('/system/service-types')
  },

  getVersion() {
    return request.get('/system/version')
  },

  checkUpdate(version) {
    return request.post('/system/check-update', { version })
  },

  getLocation(latitude, longitude) {
    return request.get('/system/location', { latitude, longitude })
  },

  searchLocation(keyword) {
    return request.get('/system/search-location', { keyword })
  },

  getWeather(city) {
    return request.get('/system/weather', { city })
  },

  getAnnouncements(params = {}) {
    return request.get('/system/announcements', {
      page: params.page || 1,
      pageSize: params.pageSize || 10
    })
  },

  getHotSearch() {
    return request.get('/system/hot-search')
  },

  getRecommendedKeywords() {
    return request.get('/system/recommended-keywords')
  },

  checkSensitive(content) {
    return request.post('/system/check-sensitive', { content })
  },

  submitFeedback(feedbackData) {
    return request.post('/system/feedback', feedbackData)
  },

  getHelp() {
    return request.get('/system/help')
  },

  getAbout() {
    return request.get('/system/about')
  },

  getPrivacy() {
    return request.get('/system/privacy')
  },

  getAgreement() {
    return request.get('/system/agreement')
  }
}

module.exports = systemAPI
