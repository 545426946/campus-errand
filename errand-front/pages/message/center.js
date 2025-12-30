// 消息中心页面
const { getChatList } = require('../../api/message.js');

Page({
  data: {
    messageList: [],
    loading: false
  },

  onLoad: function (options) {
    console.log('消息中心加载');
    this.loadMessages();
  },

  onShow: function () {
    console.log('消息中心显示');
    // 每次显示时刷新消息
    this.loadMessages();
  },

  onPullDownRefresh: function () {
    console.log('下拉刷新消息');
    this.loadMessages();
    wx.stopPullDownRefresh();
  },

  // 加载消息列表（按订单分组）
  async loadMessages() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const res = await getChatList();
      console.log('聊天列表响应:', res);

      if (res.code === 0) {
        const userId = parseInt(wx.getStorageSync('userId'));
        
        // 处理聊天列表数据
        const conversations = res.data.map(conv => ({
          ...conv,
          time_ago: this.formatTimeAgo(conv.last_message_time),
          has_unread: conv.unread_count > 0,
          // 判断最后一条消息是否是我发送的
          is_my_last_message: this.isMyLastMessage(conv.last_message, userId),
          // 订单状态文本
          order_status_text: this.getOrderStatusText(conv.order_status)
        }));

        this.setData({
          messageList: conversations,
          loading: false
        });

        console.log('消息列表加载成功，共', conversations.length, '个会话');
      } else {
        this.setData({ loading: false });
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 判断最后一条消息是否是我发送的
  isMyLastMessage(lastMessage, userId) {
    // 这里可以根据实际情况判断
    // 如果后端返回了 last_sender_id，可以直接比较
    return false; // 默认返回false
  },

  // 获取订单状态文本
  getOrderStatusText(status) {
    const statusMap = {
      'pending': '待接单',
      'accepted': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  // 点击消息，跳转到聊天页面
  onMessageTap(e) {
    const orderId = e.currentTarget.dataset.orderId;
    console.log('查看订单聊天:', orderId);

    wx.navigateTo({
      url: `/pages/chat/chat?orderId=${orderId}`
    });
  },

  // 格式化时间为"xx分钟前"
  formatTimeAgo(dateString) {
    if (!dateString) return '';
    
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

    // 超过7天显示具体日期
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
});
