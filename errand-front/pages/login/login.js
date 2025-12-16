// 登录页面
const userAPI = require('../../api/user.js');

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    hasUserInfo: false
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('token');
    if (token) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 测试账号登录
  async onTestLogin() {
    try {
      wx.showLoading({ title: '登录中...' });

      // 使用测试账号登录
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://localhost:3000/api/auth/login',
          method: 'POST',
          data: {
            email: 'student1@example.com',
            password: 'admin123'
          },
          success: resolve,
          fail: reject
        });
      });
      
      console.log('登录响应:', result.data);
      
      if (result.data && result.data.success && result.data.token) {
        // 保存token和用户信息
        wx.setStorageSync('token', result.data.token);
        wx.setStorageSync('userInfo', result.data.user);
        
        // 更新全局状态
        const app = getApp();
        app.globalData.isLogin = true;
        app.globalData.userInfo = result.data.user;
        app.globalData.loginReady = true;
        
        wx.hideLoading();
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
        
      } else {
        throw new Error(result.data?.message || '登录失败');
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('登录失败:', error);
      
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  },

  // 微信登录（暂时保留）
  async onWechatLogin() {
    // 暂时使用测试登录
    this.onTestLogin();
    return;
    
    try {
      wx.showLoading({ title: '登录中...' });

      // 获取微信登录code
      const loginRes = await wx.login();
      
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }

      // 调用后端登录接口
      const result = await userAPI.login(loginRes.code);
      
      // 保存token和用户信息
      wx.setStorageSync('token', result.data.token);
      wx.setStorageSync('userInfo', result.data.user);
      
      // 更新全局状态
      const app = getApp();
      app.globalData.isLogin = true;
      app.globalData.userInfo = result.data.user;
      
      wx.hideLoading();
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      console.error('登录失败:', error);
      
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  },

  // 获取用户信息（用于头像昵称）
  async onGetUserProfile() {
    try {
      const res = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });
      
      console.log('用户信息:', res.userInfo);
      
      // 先登录，再更新用户信息
      await this.onWechatLogin();
      
      // 更新用户资料
      if (res.userInfo) {
        await userAPI.updateUserInfo({
          nickname: res.userInfo.nickName,
          avatar: res.userInfo.avatarUrl
        });
      }
      
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }
});
