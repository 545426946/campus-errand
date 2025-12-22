const app = getApp();
const userAPI = require('../../api/user.js');

Page({
  data: {
    // 历史记录列表
    historyList: [],
    loading: false,
    page: 1,
    hasMore: true,
    
    // 筛选条件
    filterType: 'all', // all, today, week, month
    
    // 统计数据
    stats: {
      totalCount: 0,
      todayCount: 0,
      weekCount: 0,
      monthCount: 0
    }
  },

  onLoad: function (options) {
    this.loadHistory();
  },

  onShow: function () {
    // 刷新列表
    this.setData({
      historyList: [],
      page: 1,
      hasMore: true
    });
    this.loadHistory();
  },

  // 加载历史记录
  loadHistory: async function (isLoadMore = false) {
    if (this.data.loading || (!this.data.hasMore && isLoadMore)) {
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await userAPI.getHistory({
        page: this.data.page,
        pageSize: 10,
        type: this.data.filterType
      });

      const newList = result.data.list || [];
      const existingList = isLoadMore ? this.data.historyList : [];

      this.setData({
        historyList: existingList.concat(newList),
        hasMore: newList.length === 10,
        page: this.data.page + 1,
        stats: {
          totalCount: result.data.totalCount || 0,
          todayCount: result.data.todayCount || 0,
          weekCount: result.data.weekCount || 0,
          monthCount: result.data.monthCount || 0
        },
        loading: false
      });

    } catch (error) {
      console.error('加载历史记录失败:', error);
      this.setData({ loading: false });
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 触底加载更多
  onReachBottom: function () {
    if (this.data.hasMore) {
      this.loadHistory(true);
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      historyList: [],
      page: 1,
      hasMore: true
    });

    this.loadHistory().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 切换筛选条件
  switchFilter: function (e) {
    const filterType = e.currentTarget.dataset.type;
    this.setData({ filterType });
    
    // 重新加载
    this.setData({
      historyList: [],
      page: 1,
      hasMore: true
    });
    this.loadHistory();
  },

  // 点击历史记录项
  onHistoryTap: function (e) {
    const item = e.currentTarget.dataset.item;
    
    if (item.type === 'order') {
      // 跳转到订单详情
      wx.navigateTo({
        url: `/pages/order/detail?id=${item.orderId}`
      });
    } else if (item.type === 'wallet') {
      // 跳转到钱包详情
      wx.navigateTo({
        url: `/pages/wallet/detail?id=${item.id}`
      });
    }
  },

  // 删除单条记录
  onDeleteItem: function (e) {
    const item = e.currentTarget.dataset.item;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？',
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: async (res) => {
        if (res.confirm) {
          await this.deleteHistoryItem(item.id);
        }
      }
    });
  },

  // 执行删除历史记录
  deleteHistoryItem: async function (historyId) {
    try {
      wx.showLoading({ title: '删除中...' });
      
      await userAPI.deleteHistoryItem(historyId);
      
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

      // 重新加载列表
      this.setData({
        historyList: [],
        page: 1,
        hasMore: true
      });
      this.loadHistory();

    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  },

  // 清空历史记录
  onClearHistory: function () {
    wx.showModal({
      title: '清空历史记录',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#ff4757',
      success: async (res) => {
        if (res.confirm) {
          await this.clearAllHistory();
        }
      }
    });
  },

  // 执行清空历史记录
  clearAllHistory: async function () {
    try {
      wx.showLoading({ title: '清空中...' });
      
      await userAPI.clearHistory(this.data.filterType);
      
      wx.hideLoading();
      wx.showToast({
        title: '清空成功',
        icon: 'success'
      });

      // 重新加载
      this.setData({
        historyList: [],
        page: 1,
        hasMore: true,
        stats: {
          totalCount: 0,
          todayCount: 0,
          weekCount: 0,
          monthCount: 0
        }
      });

    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '清空失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间
  formatTime: function (timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前';
    } else {
      return date.toLocaleDateString();
    }
  },

  // 获取操作类型文本
  getActionText: function (type, action) {
    const actionMap = {
      'order': {
        'create': '发布订单',
        'accept': '接单',
        'complete': '完成订单',
        'cancel': '取消订单'
      },
      'wallet': {
        'recharge': '账户充值',
        'withdraw': '账户提现',
        'income': '收入',
        'expense': '支出'
      }
    };
    
    return actionMap[type]?.[action] || action;
  },

  // 获取操作图标
  getActionIcon: function (type, action) {
    const iconMap = {
      'order': {
        'create': '📝',
        'accept': '✅',
        'complete': '🎉',
        'cancel': '❌'
      },
      'wallet': {
        'recharge': '💰',
        'withdraw': '💸',
        'income': '📈',
        'expense': '📉'
      }
    };
    
    return iconMap[type]?.[action] || '📄';
  }
});