const app = getApp();
const userAPI = require('../../api/user.js');

Page({
  data: {
    // 收藏列表
    favoriteList: [],
    loading: false,
    page: 1,
    hasMore: true,
    
    // 筛选条件
    filterType: 'all', // all, completed, pending
    
    // 统计数据
    stats: {
      total: 0,
      completed: 0,
      pending: 0
    }
  },

  onLoad: function (options) {
    this.loadFavorites();
  },

  onShow: function () {
    // 刷新列表
    this.setData({
      favoriteList: [],
      page: 1,
      hasMore: true
    });
    this.loadFavorites();
  },

  // 加载收藏列表
  loadFavorites: async function (isLoadMore = false) {
    if (this.data.loading || (!this.data.hasMore && isLoadMore)) {
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await userAPI.getFavoriteList({
        page: this.data.page,
        pageSize: 10
      });

      const newList = result.data.list || [];
      const existingList = isLoadMore ? this.data.favoriteList : [];

      this.setData({
        favoriteList: existingList.concat(newList),
        hasMore: newList.length === 10,
        page: this.data.page + 1,
        stats: {
          total: result.data.total || 0,
          completed: result.data.completed || 0,
          pending: result.data.pending || 0
        },
        loading: false
      });

    } catch (error) {
      console.error('加载收藏列表失败:', error);
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
      this.loadFavorites(true);
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      favoriteList: [],
      page: 1,
      hasMore: true
    });

    this.loadFavorites().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 切换筛选条件
  switchFilter: function (e) {
    const filterType = e.currentTarget.dataset.type;
    this.setData({ filterType });
    
    // 重新加载
    this.setData({
      favoriteList: [],
      page: 1,
      hasMore: true
    });
    this.loadFavorites();
  },

  // 点击收藏项
  onFavoriteTap: function (e) {
    const order = e.currentTarget.dataset.order;
    wx.navigateTo({
      url: `/pages/order/detail?id=${order.id}`
    });
  },

  // 取消收藏
  onRemoveFavorite: function (e) {
    const order = e.currentTarget.dataset.order;
    
    wx.showModal({
      title: '确认取消收藏',
      content: `确定要取消收藏「${order.title}」吗？`,
      confirmText: '取消收藏',
      confirmColor: '#ff4757',
      success: async (res) => {
        if (res.confirm) {
          await this.removeFavorite(order.id);
        }
      }
    });
  },

  // 执行取消收藏
  removeFavorite: async function (orderId) {
    try {
      wx.showLoading({ title: '处理中...' });
      
      await userAPI.removeFromFavorite(orderId);
      
      wx.hideLoading();
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });

      // 重新加载列表
      this.setData({
        favoriteList: [],
        page: 1,
        hasMore: true
      });
      this.loadFavorites();

    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 联系发布者
  onContactPublisher: function (e) {
    const order = e.currentTarget.dataset.order;
    
    wx.showActionSheet({
      itemList: ['拨打电话', '发送消息'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.makePhoneCall({
            phoneNumber: order.publisherPhone
          });
        } else if (res.tapIndex === 1) {
          wx.navigateTo({
            url: `/pages/chat/chat?userId=${order.publisherId}`
          });
        }
      }
    });
  },

  // 立即接单
  onAcceptOrder: function (e) {
    const order = e.currentTarget.dataset.order;
    
    wx.navigateTo({
      url: `/pages/order/accept?orderId=${order.id}`
    });
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
    } else {
      return date.toLocaleDateString();
    }
  },

  // 获取状态文本
  getStatusText: function (status) {
    const statusMap = {
      'pending': '待接单',
      'accepted': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  // 获取状态样式
  getStatusClass: function (status) {
    const classMap = {
      'pending': 'status-pending',
      'accepted': 'status-accepted',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || '';
  }
});