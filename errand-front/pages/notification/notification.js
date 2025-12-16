// 通知页面
const notificationAPI = require('../../api/notification.js');
const { formatTime } = require('../../utils/util.js');

Page({
  data: {
    notificationList: [],
    unreadCount: 0,
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    
    typeMap: {
      'order_accepted': '订单接单',
      'order_completed': '订单完成',
      'order_cancelled': '订单取消',
      'system': '系统通知'
    }
  },

  onLoad() {
    this.loadNotifications();
    this.loadUnreadCount();
  },

  onShow() {
    // 每次显示时刷新
    this.loadNotifications(true);
    this.loadUnreadCount();
  },

  onPullDownRefresh() {
    this.loadNotifications(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    this.loadMoreNotifications();
  },

  // 加载通知列表
  async loadNotifications(refresh = false) {
    if (this.data.loading) return;

    if (refresh) {
      this.setData({
        page: 1,
        notificationList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const result = await notificationAPI.getNotifications({
        page: this.data.page,
        pageSize: this.data.pageSize
      });

      const notifications = result.data.map(item => ({
        ...item,
        createTime: this.formatTimeAgo(item.created_at),
        typeText: this.data.typeMap[item.type] || '通知'
      }));

      const newList = refresh ? notifications : [...this.data.notificationList, ...notifications];

      this.setData({
        notificationList: newList,
        hasMore: notifications.length >= this.data.pageSize,
        loading: false
      });

    } catch (error) {
      console.error('加载通知失败:', error);
      this.setData({ loading: false });

      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    }
  },

  // 加载更多
  loadMoreNotifications() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({
      page: this.data.page + 1
    });

    this.loadNotifications();
  },

  // 加载未读数量
  async loadUnreadCount() {
    try {
      const result = await notificationAPI.getUnreadCount();
      this.setData({
        unreadCount: result.data.count
      });
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  },

  // 点击通知
  async onNotificationTap(e) {
    const { id, orderId } = e.currentTarget.dataset;

    // 标记为已读
    try {
      await notificationAPI.markAsRead(id);
      
      // 更新列表中的状态
      const list = this.data.notificationList.map(item => {
        if (item.id === id) {
          return { ...item, is_read: true };
        }
        return item;
      });

      this.setData({
        notificationList: list,
        unreadCount: Math.max(0, this.data.unreadCount - 1)
      });

    } catch (error) {
      console.error('标记已读失败:', error);
    }

    // 跳转到订单详情
    if (orderId) {
      wx.navigateTo({
        url: `/pages/order/detail?id=${orderId}`
      });
    }
  },

  // 删除通知
  async onDeleteNotification(e) {
    const { id } = e.currentTarget.dataset;

    try {
      const res = await wx.showModal({
        title: '确认删除',
        content: '确定要删除这条通知吗？'
      });

      if (!res.confirm) return;

      await notificationAPI.deleteNotification(id);

      // 从列表中移除
      const list = this.data.notificationList.filter(item => item.id !== id);

      this.setData({
        notificationList: list
      });

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

    } catch (error) {
      console.error('删除通知失败:', error);

      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
    }
  },

  // 全部标记为已读
  async onMarkAllRead() {
    try {
      await notificationAPI.markAllAsRead();

      // 更新列表状态
      const list = this.data.notificationList.map(item => ({
        ...item,
        is_read: true
      }));

      this.setData({
        notificationList: list,
        unreadCount: 0
      });

      wx.showToast({
        title: '已全部标记为已读',
        icon: 'success'
      });

    } catch (error) {
      console.error('标记失败:', error);

      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间
  formatTimeAgo(dateString) {
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
