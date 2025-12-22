// 个人信息页面
const app = getApp();
const userAPI = require('../../api/user.js');

Page({
  data: {
    userInfo: {
      username: '',
      nickname: '',
      phone: '',
      email: '',
      gender: 'other',
      school: '',
      bio: '',
      avatar: ''
    },
    originalUserInfo: {},
    saving: false
  },

  onLoad: function (options) {
    console.log('个人信息页面加载');
  },

  onShow: function () {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo: function () {
    const userInfo = wx.getStorageSync('userInfo') || {};
    
    this.setData({
      userInfo: {
        username: userInfo.username || '',
        nickname: userInfo.nickname || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        gender: userInfo.gender || 'other',
        school: userInfo.school || '',
        bio: userInfo.bio || '',
        avatar: userInfo.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0MCIgZmlsbD0iI0Q5RDlEOSIvPgo8ZWxsaXBzZSBjeD0iMTAwIiBjeT0iMTYwIiByeD0iNjAiIHJ5PSI0MCIgZmlsbD0iI0Q5RDlEOSIvPgo8L3N2Zz4='
      },
      originalUserInfo: { ...userInfo }
    });
    
    console.log('加载用户信息:', this.data.userInfo);
  },

  // 更换头像
  onChangeAvatar: function () {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: function (res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.uploadAvatar(tempFilePath);
      },
      fail: function (error) {
        console.error('选择图片失败:', error);
      }
    });
  },

  // 上传头像
  uploadAvatar: function (filePath) {
    const that = this;
    wx.showLoading({
      title: '上传中...'
    });

    // 这里应该调用文件上传API
    // 临时处理：直接使用本地路径
    setTimeout(() => {
      that.setData({
        'userInfo.avatar': filePath
      });
      wx.hideLoading();
      wx.showToast({
        title: '头像更新成功',
        icon: 'success'
      });
    }, 1000);
  },

  // 输入事件处理
  onNicknameInput: function (e) {
    this.setData({
      'userInfo.nickname': e.detail.value
    });
  },

  onPhoneInput: function (e) {
    this.setData({
      'userInfo.phone': e.detail.value
    });
  },

  onEmailInput: function (e) {
    this.setData({
      'userInfo.email': e.detail.value
    });
  },

  onGenderSelect: function (e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      'userInfo.gender': gender
    });
  },

  onSchoolInput: function (e) {
    this.setData({
      'userInfo.school': e.detail.value
    });
  },

  onBioInput: function (e) {
    this.setData({
      'userInfo.bio': e.detail.value
    });
  },

  // 保存个人信息
  onSave: async function () {
    if (this.data.saving) {
      return;
    }

    // 验证必填字段
    if (!this.data.userInfo.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    if (this.data.userInfo.phone && !/^1[3-9]\d{9}$/.test(this.data.userInfo.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    // 验证邮箱格式
    if (this.data.userInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.data.userInfo.email)) {
      wx.showToast({
        title: '请输入正确的邮箱',
        icon: 'none'
      });
      return;
    }

    this.setData({ saving: true });

    try {
      // 调用后端API更新用户信息
      const result = await userAPI.updateUserProfile(this.data.userInfo);
      
      if (result.code === 0 || result.success === true) {
        // 更新本地存储
        wx.setStorageSync('userInfo', {
          ...wx.getStorageSync('userInfo'),
          ...this.data.userInfo
        });

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: result.message || '保存失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存个人信息失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  }
});