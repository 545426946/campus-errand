const commonAPI = require('../../api/common.js');

Page({
  data: {
    // 反馈列表
    feedbackList: [],
    
    // 分页信息
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    
    // 加载状态
    loading: false,
    refreshing: false,
    
    // 统计信息
    stats: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    },
    
    // 反馈类型映射
    typeMap: {
      'bug': { name: 'Bug反馈', icon: '🐛', color: '#ff4757' },
      'feature': { name: '功能建议', icon: '💡', color: '#ffa502' },
      'complaint': { name: '投诉建议', icon: '⚠️', color: '#ff6348' },
      'other': { name: '其他问题', icon: '❓', color: '#747d8c' }
    },
    
    // 状态映射
    statusMap: {
      'pending': { name: '待处理', icon: '⏳', color: '#ffa502' },
      'processing': { name: '处理中', icon: '🔄', color: '#1e90ff' },
      'resolved': { name: '已解决', icon: '✅', color: '#2ed573' },
      'closed': { name: '已关闭', icon: '🔒', color: '#747d8c' }
    }
  },

  onLoad: function (options) {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    
    if (!token) {
      wx.showModal({
        title: '未登录',
        content: '请先登录后再查看反馈历史',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            });
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }
    
    this.loadFeedbackList();
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      page: 1,
      feedbackList: [],
      refreshing: true
    });
    
    this.loadFeedbackList().then(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadFeedbackList();
    }
  },

  // 加载反馈列表
  loadFeedbackList: async function () {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const result = await commonAPI.getFeedbackHistory({
        page: this.data.page,
        pageSize: this.data.pageSize
      });

      if (!result.data || !result.data.list) {
        wx.showToast({
          title: '数据格式错误',
          icon: 'none'
        });
        return;
      }

      const newList = this.data.page === 1 
        ? result.data.list 
        : [...this.data.feedbackList, ...result.data.list];

      // 计算统计信息
      const stats = this.calculateStats(result.data.list);

      this.setData({
        feedbackList: newList,
        total: result.data.total,
        hasMore: newList.length < result.data.total,
        stats: stats
      });

    } catch (error) {
      console.error('加载反馈列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 计算统计信息
  calculateStats: function (list) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: list.length,
      today: list.filter(item => new Date(item.created_at) >= today).length,
      thisWeek: list.filter(item => new Date(item.created_at) >= weekAgo).length,
      thisMonth: list.filter(item => new Date(item.created_at) >= monthAgo).length
    };
  },

  // 查看反馈详情
  viewDetail: function (e) {
    const feedback = e.currentTarget.dataset.feedback;
    
    const typeInfo = this.data.typeMap[feedback.type] || this.data.typeMap['other'];
    const statusInfo = this.data.statusMap[feedback.status] || this.data.statusMap['pending'];
    
    let content = `【反馈类型】\n${typeInfo.icon} ${typeInfo.name}\n\n`;
    content += `【反馈标题】\n${feedback.title}\n\n`;
    content += `【反馈内容】\n${feedback.content}\n\n`;
    content += `【当前状态】\n${statusInfo.icon} ${statusInfo.name}\n\n`;
    
    if (feedback.contact) {
      content += `【联系方式】\n${feedback.contact}\n\n`;
    }
    
    if (feedback.reply) {
      content += `【官方回复】\n${feedback.reply}\n\n`;
      content += `【回复时间】\n${this.formatTime(feedback.replied_at)}`;
    }
    
    wx.showModal({
      title: '反馈详情',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 预览图片
  previewImages: function (e) {
    const images = e.currentTarget.dataset.images;
    if (images && images.length > 0) {
      wx.previewImage({
        urls: images,
        current: images[0]
      });
    }
  },

  // 格式化时间
  formatTime: function (dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    
    if (date.toDateString() === now.toDateString()) {
      return '今天 ' + date.toTimeString().slice(0, 5);
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toTimeString().slice(0, 5);
    }
    
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}-${date.getDate()} ${date.toTimeString().slice(0, 5)}`;
    }
    
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },

  // 新建反馈
  createFeedback: function () {
    wx.navigateBack();
  }
});
