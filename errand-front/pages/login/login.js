// 登录页面
const userAPI = require('../../api/user.js');
const authUtil = require('../../utils/auth.js');
const config = require('../../utils/config.js');

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    hasUserInfo: false,
    isRegisterMode: false, // 是否为注册模式
    username: '',
    password: '',
    confirmPassword: ''
  },

  onLoad(options) {
    // 检查是否已登录，如果已登录且没有强制参数，则跳转首页
    if (authUtil.isLoggedIn() && !options.force) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 切换登录/注册模式
  toggleMode() {
    this.setData({
      isRegisterMode: !this.data.isRegisterMode,
      username: '',
      password: '',
      confirmPassword: ''
    });
  },

  // 输入用户名
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 输入确认密码
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 账号密码登录
  async onAccountLogin() {
    const { username, password } = this.data;

    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '登录中...', mask: true });

      // 调用登录 API
      const result = await userAPI.accountLogin(username, password);
      
      console.log('登录成功:', result);
      
      // 保存登录信息
      authUtil.saveLoginInfo(result.token, result.user);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });
      
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
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 注册
  async onRegister() {
    const { username, password, confirmPassword } = this.data;

    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return;
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码长度不能少于6位',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '注册中...', mask: true });

      // 调用注册 API
      const result = await userAPI.register(username, password, confirmPassword);
      
      console.log('注册成功:', result);
      
      // 保存登录信息
      authUtil.saveLoginInfo(result.token, result.user);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 1500
      });
      
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      console.error('注册失败:', error);
      
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 测试账号登录
  async onTestLogin() {
    try {
      wx.showLoading({ title: '登录中...', mask: true });

      // 使用测试账号登录
      const result = await userAPI.accountLogin('student1', 'admin123');
      
      console.log('登录成功:', result);
      
      // 保存登录信息
      authUtil.saveLoginInfo(result.token, result.user);
      
      wx.hideLoading();
      
      console.log('登录成功，Token已保存:', result.token.substring(0, 20) + '...');
      console.log('用户信息:', result.user);
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
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
        title: error.message || '登录失败，请检查网络',
        icon: 'none',
        duration: 2000
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
