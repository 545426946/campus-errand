// 我的订单页面（完整后端交互版本）
const app = getApp();
const orderAPI = require('../../api/order.js');
const { formatTime } = require('../../utils/util.js');
const config = require('../../utils/config.js');

Page({
  data: {
    currentTab: 0,
    tabs: ['我发布的', '我接受的', '待接单', '进行中', '已完成'],
    
    // 订单列表（从后端获取）
    orderList: [],
    
    // 分页
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    
    // 配置
    statusMap: config.orderStatusMap,
    serviceTypeMap: config.serviceTypeMap
  },

  onLoad: function (options) {
    console.log('订单页面加载');
    // 不再调用 checkLogin，直接加载订单列表
    this.loadOrderList();
  },

  onShow: function () {
    console.log('订单页面显示');
    this.loadOrderList(true);
  },

  onPullDownRefresh: function () {
    console.log('下拉刷新');
    this.loadOrderList(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    this.loadMoreOrders();
  },

  // 检查登录状态（不强制跳转）
  checkLogin: function() {
    const token = wx.getStorageSync('token');
    if (!token) {
      console.log('用户未登录，可以浏览但部分功能受限');
      // 不再强制跳转到登录页面，让用户自由浏览
    }
    return !!token;
  },

  // 加载订单列表（从后端获取）
  loadOrderList: async function (refresh = false) {
    // 检查登录状态，但不阻止加载
    const isLoggedIn = this.checkLogin();
    
    if (this.data.loading) return;
    
    if (refresh) {
      this.setData({
        page: 1,
        orderList: [],
        hasMore: true
      });
    }
    
    this.setData({ loading: true });
    
    try {
      let result;
      const { currentTab } = this.data;
      
      // 未登录时，只能查看公开订单列表
      if (!isLoggedIn) {
        if (currentTab === 0 || currentTab === 1) {
          // "我发布的"和"我接受的"需要登录
          this.setData({
            orderList: [],
            hasMore: false,
            loading: false
          });
          
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          });
          return;
        }
        
        // 未登录用户可以查看公开订单列表
        const statusMap = {
          2: 'pending',
          3: 'accepted',
          4: 'completed'
        };
        result = await orderAPI.getOrderList({
          page: this.data.page,
          pageSize: this.data.pageSize,
          status: statusMap[currentTab]
        });
      } else {
        // 已登录用户，根据标签页调用不同的API
        if (currentTab === 0) {
          // 我发布的订单
          result = await orderAPI.getMyPublishOrders({
            page: this.data.page,
            pageSize: this.data.pageSize
          });
        } else if (currentTab === 1) {
          // 我接受的订单
          result = await orderAPI.getMyAcceptedOrders({
            page: this.data.page,
            pageSize: this.data.pageSize
          });
        } else {
          // 按状态筛选
          const statusMap = {
            2: 'pending',
            3: 'accepted',
            4: 'completed'
          };
          result = await orderAPI.getOrderList({
            page: this.data.page,
            pageSize: this.data.pageSize,
            status: statusMap[currentTab]
          });
        }
      }
      
      // 处理订单数据
      const orders = result.data.map(order => {
        const userInfo = wx.getStorageSync('userInfo');
        return {
          ...order,
          statusText: this.data.statusMap[order.status],
          typeText: this.data.serviceTypeMap[order.type],
          statusClass: `status-${order.status}`,
          createTime: this.formatTimeAgo(order.created_at),
          isMyOrder: order.user_id === userInfo?.id,
          isAccepted: order.acceptor_id === userInfo?.id,
          // 字段映射
          pickupLocation: order.pickup_location || order.pickupLocation || '',
          deliveryLocation: order.delivery_location || order.deliveryLocation || '',
          orderNo: order.order_no || order.orderNo || order.id
        };
      });
      
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

  // 加载更多
  loadMoreOrders: function() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.loadOrderList();
  },

  // 切换标签
  switchTab: function (e) {
    const index = e.currentTarget.dataset.index;
    const isLoggedIn = this.checkLogin();
    
    // 未登录时，切换到"我发布的"或"我接受的"标签页需要提示登录
    if (!isLoggedIn && (index === 0 || index === 1)) {
      wx.showModal({
        title: '需要登录',
        content: '查看个人订单需要登录，是否前往登录？',
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
    
    this.setData({
      currentTab: index
    });
    this.loadOrderList(true);
  },

  // 点击订单
  onOrderTap: function (e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('查看订单详情:', orderId);
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

  // 取消订单
  onCancelOrder: async function (e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('取消订单:', orderId);

    // 检查登录 - 取消订单需要登录
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '需要登录',
        content: '取消订单需要登录后使用，是否前往登录？',
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

    try {
      const res = await wx.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        editable: true,
        placeholderText: '请输入取消原因（可选）'
      });
      
      if (!res.confirm) return;
      
      wx.showLoading({ title: '取消中...' });
      
      const reason = res.content || '用户取消';
      await orderAPI.cancelOrder(orderId, reason);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '已取消订单',
        icon: 'success'
      });
      
      setTimeout(() => {
        this.loadOrderList(true);
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      console.error('取消订单失败:', error);
      
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 完成订单
  onCompleteOrder: async function (e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('完成订单:', orderId);

    // 检查登录 - 完成订单需要登录
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '需要登录',
        content: '完成订单需要登录后使用，是否前往登录？',
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

    try {
      const res = await wx.showModal({
        title: '确认完成',
        content: '确定订单已完成吗？完成后将无法撤销。'
      });
      
      if (!res.confirm) return;
      
      wx.showLoading({ title: '处理中...' });
      
      await orderAPI.completeOrder(orderId);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '订单已完成',
        icon: 'success'
      });
      
      setTimeout(() => {
        this.loadOrderList(true);
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      console.error('完成订单失败:', error);
      
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  // 查看详情
  onViewDetail: function (e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail?id=${orderId}`
    });
  },

  // 格式化时间
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
