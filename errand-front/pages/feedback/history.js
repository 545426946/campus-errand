const orderAPI = require('../../api/order.js');

Page({
  data: {
    // 订单列表
    publishOrders: [],  // 发布的订单
    acceptedOrders: [], // 接的订单
    
    // 当前标签
    currentTab: 'publish', // publish | accepted
    
    // 分页信息
    publishPage: 1,
    acceptedPage: 1,
    pageSize: 20,
    publishTotal: 0,
    acceptedTotal: 0,
    publishHasMore: true,
    acceptedHasMore: true,
    
    // 加载状态
    loading: false,
    refreshing: false,
    
    // 统计信息
    stats: {
      publishTotal: 0,
      publishToday: 0,
      acceptedTotal: 0,
      acceptedToday: 0
    },
    
    // 订单状态映射
    statusMap: {
      'pending': { name: '待接单', icon: '⏳', color: '#ffa502' },
      'accepted': { name: '已接单', icon: '✅', color: '#1e90ff' },
      'in_progress': { name: '进行中', icon: '🔄', color: '#1e90ff' },
      'completed': { name: '已完成', icon: '✔️', color: '#2ed573' },
      'cancelled': { name: '已取消', icon: '❌', color: '#ff4757' },
      'expired': { name: '已过期', icon: '⏰', color: '#747d8c' }
    }
  },

  onLoad: function (options) {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    console.log('=== 订单历史页面加载 ===');
    console.log('Token:', token ? token.substring(0, 30) + '...' : '未登录');
    console.log('用户信息:', userInfo);
    
    if (!token) {
      wx.showModal({
        title: '未登录',
        content: '请先登录后再查看订单历史',
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
    
    // 加载初始数据
    this.loadOrders();
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      publishPage: 1,
      acceptedPage: 1,
      publishOrders: [],
      acceptedOrders: [],
      refreshing: true
    });
    
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  // 上拉加载更多
  onReachBottom: function () {
    const { currentTab, publishHasMore, acceptedHasMore, loading } = this.data;
    
    if (loading) return;
    
    if (currentTab === 'publish' && publishHasMore) {
      this.setData({ publishPage: this.data.publishPage + 1 });
      this.loadPublishOrders();
    } else if (currentTab === 'accepted' && acceptedHasMore) {
      this.setData({ acceptedPage: this.data.acceptedPage + 1 });
      this.loadAcceptedOrders();
    }
  },

  // 切换标签
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    
    // 如果该标签的数据还没加载，则加载
    if (tab === 'publish' && this.data.publishOrders.length === 0) {
      this.loadPublishOrders();
    } else if (tab === 'accepted' && this.data.acceptedOrders.length === 0) {
      this.loadAcceptedOrders();
    }
  },

  // 加载订单（两种类型都加载）
  loadOrders: async function () {
    await Promise.all([
      this.loadPublishOrders(),
      this.loadAcceptedOrders()
    ]);
    
    // 计算统计信息
    this.calculateStats();
  },

  // 加载发布的订单
  loadPublishOrders: async function () {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      console.log('加载发布的订单，页码:', this.data.publishPage);
      
      const result = await orderAPI.getMyPublishOrders({
        page: this.data.publishPage,
        pageSize: this.data.pageSize
      });

      console.log('发布订单返回:', result);

      const newList = this.data.publishPage === 1 
        ? result.data.list 
        : [...this.data.publishOrders, ...result.data.list];

      this.setData({
        publishOrders: newList,
        publishTotal: result.data.total,
        publishHasMore: newList.length < result.data.total
      });

    } catch (error) {
      console.error('加载发布订单失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载接的订单
  loadAcceptedOrders: async function () {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      console.log('加载接的订单，页码:', this.data.acceptedPage);
      
      const result = await orderAPI.getMyAcceptedOrders({
        page: this.data.acceptedPage,
        pageSize: this.data.pageSize
      });

      console.log('接单返回:', result);

      const newList = this.data.acceptedPage === 1 
        ? result.data.list 
        : [...this.data.acceptedOrders, ...result.data.list];

      this.setData({
        acceptedOrders: newList,
        acceptedTotal: result.data.total,
        acceptedHasMore: newList.length < result.data.total
      });

    } catch (error) {
      console.error('加载接单失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 计算统计信息
  calculateStats: function () {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const publishToday = this.data.publishOrders.filter(
      item => new Date(item.created_at) >= today
    ).length;

    const acceptedToday = this.data.acceptedOrders.filter(
      item => new Date(item.accepted_at || item.created_at) >= today
    ).length;

    this.setData({
      stats: {
        publishTotal: this.data.publishTotal,
        publishToday: publishToday,
        acceptedTotal: this.data.acceptedTotal,
        acceptedToday: acceptedToday
      }
    });
  },

  // 查看订单详情
  viewOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail?id=${orderId}`
    });
  },

  // 格式化时间
  formatTime: function (dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // 1分钟内
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 1小时内
    if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return '今天 ' + date.toTimeString().slice(0, 5);
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toTimeString().slice(0, 5);
    }
    
    // 今年
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}-${date.getDate()} ${date.toTimeString().slice(0, 5)}`;
    }
    
    // 其他
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
});
