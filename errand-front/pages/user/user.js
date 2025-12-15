const app = getApp()

Page({
  data: {
    isLogin: false,
    userInfo: {},
    userStats: {
      completedOrders: 0,
      goodRate: 98
    },
    menuCounts: {
      pendingOrders: 0,
      publishOrders: 0
    },
    userWallet: {
      balance: '25.80'
    },
    userCertification: {
      status: 'unverified', // verified, unverified, pending
      statusText: '未认证'
    }
  },

  onLoad: function (options) {
    console.log('用户中心加载')
  },

  onShow: function () {
    console.log('用户中心显示')
    this.updateUserInfo()
    this.loadUserData()
  },

  // 更新用户信息
  updateUserInfo: function () {
    this.setData({
      isLogin: app.globalData.isLogin,
      userInfo: app.globalData.userInfo || {}
    })
  },

  // 加载用户数据
  loadUserData: function () {
    if (!this.data.isLogin) {
      return
    }

    // 这里应该调用API获取用户相关数据
    this.setData({
      userStats: {
        completedOrders: 23,
        goodRate: 98
      },
      menuCounts: {
        pendingOrders: 2,
        publishOrders: 1
      },
      userWallet: {
        balance: '25.80'
      },
      userCertification: {
        status: 'unverified',
        statusText: '未认证'
      }
    })
  },

  // 点击头像
  onAvatarTap: function () {
    if (!this.data.isLogin) {
      this.login()
    } else {
      // 可以跳转到个人资料编辑页面
      wx.navigateTo({
        url: '/pages/profile/profile'
      })
    }
  },

  // 登录
  login: function () {
    wx.showModal({
      title: '登录提示',
      content: '请使用微信授权登录',
      showCancel: false,
      success: () => {
        app.login((code) => {
          // 登录成功后更新页面状态
          this.updateUserInfo()
          this.loadUserData()
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
        })
      }
    })
  },

  // 点击设置
  onSettingTap: function () {
    wx.navigateTo({
      url: '/pages/setting/setting'
    })
  },

  // 点击菜单项
  onMenuTap: function (e) {
    const type = e.currentTarget.dataset.type
    
    if (!this.data.isLogin) {
      this.login()
      return
    }

    switch (type) {
      case 'myOrders':
        wx.switchTab({
          url: '/pages/order/order'
        })
        break
      case 'myPublish':
        wx.navigateTo({
          url: '/pages/my-publish/my-publish'
        })
        break
      case 'myWallet':
        wx.navigateTo({
          url: '/pages/wallet/wallet'
        })
        break
      case 'favorite':
        wx.navigateTo({
          url: '/pages/favorite/favorite'
        })
        break
      case 'history':
        wx.navigateTo({
          url: '/pages/history/history'
        })
        break
      case 'certification':
        wx.navigateTo({
          url: '/pages/certification/certification'
        })
        break
      case 'help':
        wx.navigateTo({
          url: '/pages/help/help'
        })
        break
      case 'feedback':
        wx.navigateTo({
          url: '/pages/feedback/feedback'
        })
        break
      case 'about':
        wx.navigateTo({
          url: '/pages/about/about'
        })
        break
    }
  },

  // 退出登录
  onLogout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.updateUserInfo()
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }
})