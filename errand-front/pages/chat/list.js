const { getChatList } = require('../../api/message.js');

Page({
  data: {
    chatList: [],
    loading: false
  },

  onLoad() {
    this.loadChatList();
  },

  onShow() {
    this.loadChatList();
  },

  onPullDownRefresh() {
    this.loadChatList();
    wx.stopPullDownRefresh();
  },

  async loadChatList() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });

    try {
      const res = await getChatList();
      
      if (res.code === 0) {
        const chatList = res.data.map(chat => ({
          ...chat,
          time_ago: this.formatTimeAgo(chat.last_message_time)
        }));

        this.setData({
          chatList,
          loading: false
        });
      } else {
        this.setData({ loading: false });
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载聊天列表失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  onChatTap(e) {
    const orderId = e.currentTarget.dataset.orderId;
    wx.navigateTo({
      url: `/pages/chat/chat?orderId=${orderId}`
    });
  },

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

    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
});
