// 首页 - 订单列表（完整后端交互版本）
const app = getApp();
const orderAPI = require('../../api/order.js');
const { formatTime } = require('../../utils/util.js');
const config = require('../../utils/config.js');

Page({
  data: {
    // 搜索
    searchKeyword: '',
    
    // 服务类型（使用emoji作为临时图标）
    serviceTypes: [
      { id: 1, name: '快递代取', icon: '📦', emoji: true },
      { id: 2, name: '外卖配送', icon: '🍔', emoji: true },
      { id: 3, name: '代购服务', icon: '🛒', emoji: true },
      { id: 4, name: '其他服务', icon: '✨', emoji: true }
    ],
    
    // 订单列表（从后端获取）
    orderList: [],
    
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    
    // 筛选
    filterStatus: '', // pending, accepted, completed, cancelled
    serviceType: '', // 1-快递代取，2-外卖配送，3-代购服务，4-其他
    
    // 配置
    statusMap: config.orderStatusMap,
    serviceTypeMap: config.serviceTypeMap
  },

  onLoad: function (options) {
    console.log('首页加载');
    
    // 等待登录完成后再加载数据
    const app = getApp();
    app.waitForLogin(() => {
      console.log('登录完成，开始加载数据');
      this.checkLogin();
      this.loadOrderList();
    });
  },

  onShow: function () {
    console.log('首页显示');
    // 每次显示时刷新数据
    this.loadOrderList(true);
  },

  onPullDownRefresh: function () {
    console.log('下拉刷新');
    this.loadOrderList(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    console.log('上拉加载更多');
    this.loadMoreOrders();
  },

  // 检查登录状态（不强制跳转）
  checkLogin: function() {
    const token = wx.getStorageSync('token');
    if (!token) {
      console.log('用户未登录，可以浏览但部分功能受限');
      // 不再弹窗提示，让用户自由浏览
    }
    return !!token;
  },

  // 加载订单列表（从后端获取）
  loadOrderList: async function (refresh = false) {
    // 防止重复加载
    if (this.data.loading) return;
    
    // 刷新时重置页码
    if (refresh) {
      this.setData({
        page: 1,
        orderList: [],
        hasMore: true
      });
    }
    
    this.setData({ loading: true });
    
    try {
      const result = await orderAPI.getOrderList({
        page: this.data.page,
        pageSize: this.data.pageSize,
        status: this.data.filterStatus,
        type: this.data.serviceType,
        keyword: this.data.searchKeyword
      });
      
      // 处理订单数据
      const orders = result.data.map(order => ({
        ...order,
        statusText: this.data.statusMap[order.status],
        typeText: this.data.serviceTypeMap[order.type],
        statusClass: `status-${order.status}`,
        createTime: this.formatTimeAgo(order.created_at),
        location: order.pickup_location
      }));
      
      // 合并数据
      const newList = refresh ? orders : [...this.data.orderList, ...orders];
      
      this.setData({
        orderList: newList,
        hasMore: orders.length >= this.data.pageSize,
        loading: false
      });
      
      console.log('订单列表加载成功，共', newList.length, '条');
      
    } catch (error) {
      console.error('加载订单失败:', error);
      this.setData({ loading: false });
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    }
  },

  // 加载更多订单
  loadMoreOrders: function () {
    if (!this.data.hasMore || this.data.loading) {
      return;
    }
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.loadOrderList();
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索
  onSearch: function () {
    console.log('搜索关键词:', this.data.searchKeyword);
    this.loadOrderList(true);
  },

  // 点击服务类型
  onServiceTap: function (e) {
    const { id } = e.currentTarget.dataset;
    console.log('选择服务类型:', id);
    
    this.setData({
      serviceType: id === this.data.serviceType ? '' : id
    });
    
    this.loadOrderList(true);
  },

  // 点击订单
  onOrderTap: function (e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('查看订单详情:', orderId);
    
    // 未登录也可以查看订单详情
    wx.navigateTo({
      url: `/pages/order/detail?id=${orderId}`
    });
  },

  // 接单
  onAcceptOrder: function (e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('接单按钮点击:', orderId);
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    
    if (!token) {
      // 未登录：弹窗提示需要登录
      wx.showModal({
        title: '需要登录',
        content: '接单功能需要登录后使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }
    
    // 已登录：直接跳转到订单详情页面
    wx.navigateTo({
      url: `/pages/order/detail?id=${orderId}`
    });
  },

  // 查看更多
  onViewMore: function () {
    wx.switchTab({
      url: '/pages/order/order'
    });
  },

  // 发布订单
  onPublishOrder: function () {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '需要登录',
        content: '发布订单需要登录后使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  },

  // 格式化时间为"xx分钟前"
  formatTimeAgo: function(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return formatTime(date);
  }
});