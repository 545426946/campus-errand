App({
  globalData: {
    userInfo: null,
    isLogin: false,
    baseUrl: 'http://localhost:3000/api',
    orderList: [],
    currentOrder: null,
    loginReady: false,
    loginCallbacks: []
  },

  onLaunch: function () {
    console.log('校园跑腿小程序启动')
    
    // 检查登录状态并自动登录
    this.autoLogin()
    
    // 获取系统信息
    this.getSystemInfo()
  },

  onShow: function (options) {
    console.log('小程序显示')
  },

  onHide: function () {
    console.log('小程序隐藏')
  },

  onError: function (msg) {
    console.error('小程序错误:', msg)
  },

  // 自动登录
  autoLogin: function () {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.isLogin = true
      this.globalData.loginReady = true
      this.globalData.userInfo = userInfo
      console.log('已有token，自动登录成功')
      this.triggerLoginCallbacks()
      return
    }

    // 没有token，标记为未登录
    console.log('未登录状态')
    this.globalData.isLogin = false
    this.globalData.loginReady = true
    this.triggerLoginCallbacks()
  },

  // 等待登录完成
  waitForLogin: function(callback) {
    if (this.globalData.loginReady) {
      callback()
    } else {
      this.globalData.loginCallbacks.push(callback)
    }
  },

  // 触发登录完成回调
  triggerLoginCallbacks: function() {
    this.globalData.loginCallbacks.forEach(callback => {
      callback()
    })
    this.globalData.loginCallbacks = []
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.isLogin = true
      this.getUserInfo()
    }
  },

  // 获取用户信息
  getUserInfo: function () {
    const that = this
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        that.globalData.userInfo = res.userInfo
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
      }
    })
  },

  // 获取系统信息
  getSystemInfo: function () {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        console.log('系统信息:', res)
      }
    })
  },

  // 登录方法
  login: function (callback) {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 这里应该调用后端接口进行登录
          console.log('登录成功，code:', res.code)
          callback && callback(res.code)
        } else {
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          })
        }
      }
    })
  },

  // 退出登录
  logout: function () {
    this.globalData.userInfo = null
    this.globalData.isLogin = false
    wx.removeStorageSync('token')
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  }
})