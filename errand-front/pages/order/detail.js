// 订单详情页面（完整后端交互版本）
const orderAPI = require('../../api/order.js');
const cancelRequestAPI = require('../../api/cancelRequest.js');
const { formatTime } = require('../../utils/util.js');
const config = require('../../utils/config.js');
const authUtil = require('../../utils/auth.js');

Page({
  data: {
    orderId: null,
    orderDetail: null,
    currentUserId: null,
    cancelRequest: null,
    
    // 权限判断
    isPublisher: false,  // 是否是发布者
    isAcceptor: false,   // 是否是接单者
    canAccept: false,    // 是否可以接单
    canCancel: false,    // 是否可以取消（直接取消，仅pending状态）
    canRequestCancel: false, // 是否可以请求取消（协商取消，accepted状态）
    canComplete: false,  // 是否可以完成
    canChat: false,      // 是否可以聊天
    
    // 配置
    statusMap: config.orderStatusMap,
    serviceTypeMap: config.serviceTypeMap
  },

  async onLoad(options) {
    // 检查登录状态（不强制跳转）
    const isLoggedIn = authUtil.isLoggedIn();
    
    this.setData({
      orderId: options.id,
      currentUserId: isLoggedIn ? authUtil.getCurrentUserId() : null
    });
    
    this.loadOrderDetail();
  },

  onShow() {
    // 每次显示时刷新数据
    if (this.data.orderId) {
      this.loadOrderDetail();
    }
  },

  // 加载订单详情（从后端获取）
  async loadOrderDetail() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await orderAPI.getOrderDetail(this.data.orderId);
      const order = result.data;
      
      // 处理数据
      order.statusText = this.data.statusMap[order.status];
      order.typeText = this.data.serviceTypeMap[order.type];
      order.createdTime = formatTime(new Date(order.created_at));
      
      // 简化处理：不再添加额外字段，直接在模板中处理
      
      if (order.accepted_at) {
        order.acceptedTime = formatTime(new Date(order.accepted_at));
      }
      
      if (order.completed_at) {
        order.completedTime = formatTime(new Date(order.completed_at));
      }
      
      if (order.cancelled_at) {
        order.cancelledTime = formatTime(new Date(order.cancelled_at));
      }
      
      // 判断权限 - 未登录用户可以查看但不能操作
      const isLoggedIn = !!this.data.currentUserId;
      const isPublisher = order.user_id === this.data.currentUserId;
      const isAcceptor = order.acceptor_id === this.data.currentUserId;
      const canAccept = isLoggedIn && order.status === 'pending' && !isPublisher;
      const canCancel = isLoggedIn && (isPublisher || isAcceptor) && order.status === 'pending';
      const canRequestCancel = isLoggedIn && isAcceptor && order.status === 'accepted';
      const canComplete = isLoggedIn && isAcceptor && order.status === 'accepted';
      const canChat = isLoggedIn && order.status === 'accepted' && (isPublisher || isAcceptor);
      
      // 加载取消请求（如果有）
      let cancelRequest = null;
      if (order.status === 'accepted' && (isPublisher || isAcceptor)) {
        try {
          const cancelResult = await cancelRequestAPI.getCancelRequest(this.data.orderId);
          if (cancelResult.code === 0 && cancelResult.data) {
            cancelRequest = cancelResult.data;
          }
        } catch (error) {
          console.log('没有取消请求或加载失败:', error);
        }
      }
      
      wx.hideLoading();
      
      this.setData({
        orderDetail: order,
        cancelRequest,
        isPublisher,
        isAcceptor,
        canAccept,
        canCancel,
        canRequestCancel,
        canComplete,
        canChat
      });
      
      console.log('=== 订单详情调试信息 ===');
      console.log('原始数据:', JSON.stringify(order, null, 2));
      console.log('接单者信息:', {
        acceptor_id: order.acceptor_id,
        acceptor_name: order.acceptor_name,
        acceptor_username: order.acceptor_username
      });
      console.log('取消请求:', cancelRequest);
      console.log('=== 调试信息结束 ===');
      
    } catch (error) {
      wx.hideLoading();
      console.error('加载订单详情失败:', error);
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      
      // 加载失败返回上一页
      setTimeout(() => {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        });
      }, 1500);
    }
  },

  // 接单
  async onAcceptOrder() {
    // 检查登录 - 接单需要登录
    if (!authUtil.isLoggedIn()) {
      await authUtil.requireLogin({
        content: '接单功能需要登录后使用'
      }).catch(() => {});
      return;
    }
    
    try {
      wx.showLoading({ title: '接单中...' });
      
      await orderAPI.acceptOrder(this.data.orderId);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '接单成功',
        icon: 'success'
      });
      
      // 刷新订单详情
      setTimeout(() => {
        this.loadOrderDetail();
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      console.error('接单失败:', error);
      
      wx.showToast({
        title: error.message || '接单失败',
        icon: 'none'
      });
    }
  },

  // 完成订单
  async onCompleteOrder() {
    // 检查登录 - 完成订单需要登录
    if (!authUtil.isLoggedIn()) {
      await authUtil.requireLogin({
        content: '完成订单需要登录后使用'
      }).catch(() => {});
      return;
    }
    
    try {
      const res = await wx.showModal({
        title: '确认完成',
        content: '确认已完成此订单？完成后将无法撤销。'
      });
      
      if (!res.confirm) return;
      
      wx.showLoading({ title: '提交中...' });
      
      await orderAPI.completeOrder(this.data.orderId);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '订单已完成',
        icon: 'success'
      });
      
      setTimeout(() => {
        this.loadOrderDetail();
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

  // 取消订单
  async onCancelOrder() {
    // 检查登录 - 取消订单需要登录
    if (!authUtil.isLoggedIn()) {
      await authUtil.requireLogin({
        content: '取消订单需要登录后使用'
      }).catch(() => {});
      return;
    }
    
    try {
      // 输入取消原因
      const res = await wx.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        editable: true,
        placeholderText: '请输入取消原因（可选）'
      });
      
      if (!res.confirm) return;
      
      wx.showLoading({ title: '取消中...' });
      
      const reason = res.content || '用户取消';
      await orderAPI.cancelOrder(this.data.orderId, reason);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '已取消',
        icon: 'success'
      });
      
      setTimeout(() => {
        this.loadOrderDetail();
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

  // 请求取消订单（协商取消）
  async onRequestCancel() {
    if (!authUtil.isLoggedIn()) {
      await authUtil.requireLogin({
        content: '请求取消需要登录后使用'
      }).catch(() => {});
      return;
    }
    
    try {
      const res = await wx.showModal({
        title: '请求取消订单',
        content: '请输入取消原因，发布者将收到您的请求',
        editable: true,
        placeholderText: '请输入取消原因'
      });
      
      if (!res.confirm) return;
      
      const reason = res.content || '接单者请求取消';
      
      wx.showLoading({ title: '发送请求中...' });
      
      await cancelRequestAPI.createCancelRequest(this.data.orderId, reason);
      
      wx.hideLoading();
      
      wx.showToast({
        title: '取消请求已发送',
        icon: 'success'
      });
      
      setTimeout(() => {
        this.loadOrderDetail();
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      console.error('发送取消请求失败:', error);
      
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      });
    }
  },

  // 处理取消请求（发布者同意或拒绝）
  async onHandleCancelRequest(e) {
    const { action } = e.currentTarget.dataset;
    
    try {
      const actionText = action === 'agree' ? '同意' : '拒绝';
      const res = await wx.showModal({
        title: `${actionText}取消请求`,
        content: `确定要${actionText}接单者的取消请求吗？`
      });
      
      if (!res.confirm) return;
      
      wx.showLoading({ title: '处理中...' });
      
      await cancelRequestAPI.handleCancelRequest(this.data.orderId, action);
      
      wx.hideLoading();
      
      wx.showToast({
        title: `已${actionText}`,
        icon: 'success'
      });
      
      setTimeout(() => {
        this.loadOrderDetail();
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      console.error('处理取消请求失败:', error);
      
      wx.showToast({
        title: error.message || '处理失败',
        icon: 'none'
      });
    }
  },

  // 进入聊天
  onChat() {
    if (!authUtil.isLoggedIn()) {
      authUtil.requireLogin({
        content: '聊天功能需要登录'
      }).catch(() => {});
      return;
    }
    
    wx.navigateTo({
      url: `/pages/chat/chat?orderId=${this.data.orderId}`
    });
  },

  // 拨打电话
  onCallPhone() {
    // 检查登录 - 拨打电话需要登录
    if (!authUtil.isLoggedIn()) {
      authUtil.requireLogin({
        content: '查看联系方式需要登录'
      }).catch(() => {});
      return;
    }
    
    const phone = this.data.orderDetail.contact_phone;
    
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: (error) => {
        console.error('拨打电话失败:', error);
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  // 联系发布者
  onContactPublisher() {
    // 检查登录 - 联系发布者需要登录
    if (!authUtil.isLoggedIn()) {
      authUtil.requireLogin({
        content: '联系发布者需要登录'
      }).catch(() => {});
      return;
    }
    
    const phone = this.data.orderDetail.publisher_phone;
    
    if (!phone) {
      wx.showToast({
        title: '无法获取联系方式',
        icon: 'none'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  // 联系接单者
  onContactAcceptor() {
    // 检查登录 - 联系接单者需要登录
    if (!authUtil.isLoggedIn()) {
      authUtil.requireLogin({
        content: '联系接单者需要登录'
      }).catch(() => {});
      return;
    }
    
    const phone = this.data.orderDetail.acceptor_phone;
    
    if (!phone) {
      wx.showToast({
        title: '暂无接单者',
        icon: 'none'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  // 预览图片
  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset;
    const images = this.data.orderDetail.images || [];
    
    wx.previewImage({
      current: url,
      urls: images
    });
  },

  // 复制文本
  onCopyText(e) {
    const { text, label } = e.currentTarget.dataset;
    
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: `${label}已复制`,
          icon: 'success'
        });
      }
    });
  },

  // 查看位置
  onViewLocation(e) {
    const { type } = e.currentTarget.dataset;
    const location = type === 'pickup' 
      ? this.data.orderDetail.pickup_location 
      : this.data.orderDetail.delivery_location;
    
    wx.showToast({
      title: location,
      icon: 'none',
      duration: 2000
    });
  },

  // 分享订单
  onShareAppMessage() {
    const order = this.data.orderDetail;
    
    return {
      title: order.title,
      path: `/pages/order/detail?id=${order.id}`,
      imageUrl: order.images?.[0] || ''
    };
  },

  // 返回上一页
  onBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  }
});
