// 用户中心页面（完整后端交互版本）
const app = getApp();
const userAPI = require('../../api/user.js');
const orderAPI = require('../../api/order.js');
const notificationAPI = require('../../api/notification.js');

Page({
  data: {
    isLogin: false,
    userInfo: {},
    
    // 用户统计（从后端获取）
    userStats: {
      completedOrders: 0,
      publishedOrders: 0,
      acceptedOrders: 0,
      pendingOrders: 0,
      inProgressOrders: 0
    },
    
    // 钱包信息（从后端获取）
    userWallet: {
      balance: '0.00'
    },
    
    // 认证状态（从后端获取）
    userCertification: {
      status: 'unverified',
      statusText: '未认证'
    },
    
    // 未读通知数量
    unreadNotificationCount: 0
  },

  onLoad: function (options) {
    console.log('用户中心加载');
  },

  onShow: function () {
    console.log('用户中心显示');
    this.updateUserInfo();
    if (this.data.isLogin) {
      this.loadUserData();
      this.loadUnreadNotificationCount();
    }
  },

  // 更新用户信息
  updateUserInfo: function () {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    console.log('更新用户信息 - Token:', token ? '存在' : '不存在');
    console.log('更新用户信息 - UserInfo:', userInfo);
    
    this.setData({
      isLogin: !!token,
      userInfo: userInfo || {}
    });
    
    console.log('页面状态 - isLogin:', this.data.isLogin);
    console.log('页面状态 - userInfo:', this.data.userInfo);
  },

  // 加载用户数据（从后端获取）
  loadUserData: async function () {
    if (!this.data.isLogin) {
      return;
    }

    try {
      // 并行请求多个接口
      const [statsResult, walletResult] = await Promise.all([
        orderAPI.getOrderStats(),
        userAPI.getWalletInfo().catch(() => ({ data: { balance: 0 } }))
      ]);
      
      // 更新统计数据
      this.setData({
        userStats: {
          completedOrders: statsResult.data.completed_count || 0,
          publishedOrders: statsResult.data.published_count || 0,
          acceptedOrders: statsResult.data.accepted_count || 0,
          pendingOrders: statsResult.data.pending_count || 0,
          inProgressOrders: statsResult.data.in_progress_count || 0
        },
        userWallet: {
          balance: (walletResult.data.balance || 0).toFixed(2)
        }
      });
      
      console.log('用户数据加载成功');
      
    } catch (error) {
      console.error('加载用户数据失败:', error);
      
      // 不显示错误提示，使用默认值
      this.setData({
        userStats: {
          completedOrders: 0,
          publishedOrders: 0,
          acceptedOrders: 0,
          pendingOrders: 0,
          inProgressOrders: 0
        }
      });
    }
  },

  // 点击头像
  onAvatarTap: function () {
    if (!this.data.isLogin) {
      this.login();
    } else {
      // 跳转到个人资料编辑页面
      wx.navigateTo({
        url: '/pages/profile/profile'
      });
    }
  },

  // 登录
  login: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 点击设置
  onSettingTap: function () {
    wx.navigateTo({
      url: '/pages/setting/setting'
    });
  },

  // 加载未读通知数量
  loadUnreadNotificationCount: async function () {
    try {
      const result = await notificationAPI.getUnreadCount();
      this.setData({
        unreadNotificationCount: result.data.count
      });
    } catch (error) {
      console.error('加载未读通知数量失败:', error);
    }
  },

  // 点击菜单项
  onMenuTap: function (e) {
    const type = e.currentTarget.dataset.type;
    
    // 需要登录的功能
    const needLoginTypes = ['myOrders', 'myPublish', 'myWallet', 'favorite', 'history', 'certification', 'notification'];
    
    if (needLoginTypes.includes(type) && !this.data.isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '此功能需要登录后使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.login();
          }
        }
      });
      return;
    }

    switch (type) {
      case 'notification':
        wx.navigateTo({
          url: '/pages/notification/notification'
        });
        break;
      case 'myOrders':
        wx.switchTab({
          url: '/pages/order/order'
        });
        break;
      case 'myPublish':
        wx.navigateTo({
          url: '/pages/my-publish/my-publish'
        });
        break;
      case 'myWallet':
        wx.navigateTo({
          url: '/pages/wallet/wallet'
        });
        break;
      case 'favorite':
        wx.navigateTo({
          url: '/pages/favorite/favorite'
        });
        break;
      case 'history':
        wx.navigateTo({
          url: '/pages/history/history'
        });
        break;
      case 'certification':
        wx.navigateTo({
          url: '/pages/certification/certification'
        });
        break;
      case 'help':
        wx.navigateTo({
          url: '/pages/help/help'
        });
        break;
      case 'feedback':
        wx.navigateTo({
          url: '/pages/feedback/feedback'
        });
        break;
      case 'about':
        wx.navigateTo({
          url: '/pages/about/about'
        });
        break;
    }
  },

  // 退出登录
  onLogout: function () {
    const authUtil = require('../../utils/auth.js');
    
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 使用认证工具清除登录信息
          authUtil.clearLoginInfo();
          
          // 更新页面状态
          this.setData({
            isLogin: false,
            userInfo: {},
            userStats: {
              completedOrders: 0,
              publishedOrders: 0,
              acceptedOrders: 0,
              pendingOrders: 0,
              inProgressOrders: 0
            },
            userWallet: {
              balance: '0.00'
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});
