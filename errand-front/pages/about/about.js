Page({
  data: {
    version: '1.0.0',
    company: {
      name: '校园跑腿团队',
      description: '专注于为大学生提供便捷的校园跑腿服务',
      website: 'https://campus-errand.com',
      email: 'service@campus-errand.com',
      phone: '400-123-4567'
    },
    
    features: [
      {
        icon: '🚀',
        title: '快速发布',
        description: '一键发布跑腿需求，快速找到帮手'
      },
      {
        icon: '💰',
        title: '安全交易',
        description: '平台担保交易，资金安全有保障'
      },
      {
        icon: '⭐',
        title: '实名认证',
        description: '用户实名认证，服务更加可靠'
      },
      {
        icon: '🎯',
        title: '精准匹配',
        description: '智能匹配跑腿需求，提高效率'
      }
    ],
    
    policies: [
      {
        title: '用户协议',
        icon: '📋',
        url: '/pages/policy/user-agreement'
      },
      {
        title: '隐私政策',
        icon: '🔒',
        url: '/pages/policy/privacy'
      },
      {
        title: '服务条款',
        icon: '📄',
        url: '/pages/policy/service'
      }
    ]
  },

  onLoad: function (options) {
    // 获取应用版本信息
    const accountInfo = wx.getAccountInfoSync();
    this.setData({
      version: accountInfo.miniProgram.version || '1.0.0'
    });
  },

  // 复制联系方式
  copyContact: function (e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 打开网页
  openWebsite: function () {
    wx.showModal({
      title: '访问官网',
      content: '即将跳转到校园跑腿官网',
      confirmText: '前往',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/webview/webview?url=https://campus-errand.com'
          });
        }
      }
    });
  },

  // 查看政策文档
  viewPolicy: function (e) {
    const policy = e.currentTarget.dataset.policy;
    wx.navigateTo({
      url: policy.url
    });
  },

  // 检查更新
  checkUpdate: function () {
    const updateManager = wx.getUpdateManager();
    
    updateManager.onCheckForUpdate(function (res) {
      console.log('是否有新版本：', res.hasUpdate);
    });

    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });

    updateManager.onUpdateFailed(function () {
      wx.showModal({
        title: '更新失败',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false
      });
    });

    // 检查更新
    updateManager.checkForUpdate();
  }
});