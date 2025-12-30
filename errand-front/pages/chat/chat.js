const { getOrderMessages, sendMessage } = require('../../api/message.js');
const { getOrderDetail } = require('../../api/order.js');

Page({
  data: {
    orderId: null,
    order: null,
    messages: [],
    inputMessage: '',
    otherUserId: null,
    otherUserName: '',
    scrollIntoView: '',
    showCancelRequest: false,
    userId: null
  },

  onLoad(options) {
    const userId = wx.getStorageSync('userId');
    this.setData({ userId });
    
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
      this.loadOrderDetail();
      this.loadMessages();
      // 每2秒刷新一次消息（更快的同步）
      this.messageTimer = setInterval(() => {
        this.loadMessages(true);
      }, 2000);
    }
  },

  onShow() {
    // 页面显示时立即刷新消息
    if (this.data.orderId) {
      this.loadMessages(true);
    }
  },

  onHide() {
    // 页面隐藏时停止定时器
    if (this.messageTimer) {
      clearInterval(this.messageTimer);
      this.messageTimer = null;
    }
  },

  onUnload() {
    // 页面卸载时清理定时器
    if (this.messageTimer) {
      clearInterval(this.messageTimer);
      this.messageTimer = null;
    }
  },

  async loadOrderDetail() {
    try {
      const res = await getOrderDetail(this.data.orderId);
      console.log('订单详情响应:', res);
      
      if (res.code === 0) {
        const order = res.data;
        const currentUserId = parseInt(wx.getStorageSync('userId'));
        
        console.log('当前用户ID:', currentUserId, typeof currentUserId);
        console.log('订单发布者ID:', order.user_id, typeof order.user_id);
        console.log('订单接单者ID:', order.acceptor_id, typeof order.acceptor_id);
        
        // 确定对方用户信息
        let otherUserId, otherUserName;
        if (parseInt(order.user_id) === currentUserId) {
          // 当前用户是发布者，对方是接单者
          otherUserId = order.acceptor_id;
          otherUserName = order.acceptor_name || order.acceptor_nickname || order.acceptor_username || '接单者';
          console.log('当前用户是发布者');
        } else {
          // 当前用户是接单者，对方是发布者
          otherUserId = order.user_id;
          otherUserName = order.publisher_name || order.publisher_nickname || order.publisher_username || '发布者';
          console.log('当前用户是接单者');
        }

        console.log('对方用户ID:', otherUserId, typeof otherUserId);
        console.log('对方用户名:', otherUserName);

        this.setData({
          order,
          otherUserId,
          otherUserName,
          showCancelRequest: order.status === 'accepted' && order.cancel_request_status !== 'pending'
        });
      } else {
        wx.showToast({
          title: res.message || '加载订单失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      wx.showToast({
        title: '加载订单失败',
        icon: 'none'
      });
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // 1分钟内
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 1小时内
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    }
    
    // 今天
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date >= today) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // 昨天
    const yesterday = new Date(today - 86400000);
    if (date >= yesterday) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `昨天 ${hours}:${minutes}`;
    }
    
    // 更早
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  },

  async loadMessages(silent = false) {
    try {
      const res = await getOrderMessages(this.data.orderId);
      console.log('加载消息响应:', res);
      
      if (res.code === 0) {
        const currentUserId = parseInt(wx.getStorageSync('userId'));
        console.log('当前用户ID (loadMessages):', currentUserId);
        
        const messages = res.data.map((msg, index) => {
          const isMine = parseInt(msg.sender_id) === currentUserId;
          console.log(`消息${index + 1}:`, {
            发送者ID: msg.sender_id,
            当前用户ID: currentUserId,
            isMine: isMine,
            发送者昵称: msg.sender_name,
            发送者头像: msg.sender_avatar
          });
          
          return {
            ...msg,
            isMine: isMine,
            sender_name: msg.sender_name || msg.sender_nickname || (isMine ? '我' : '用户'),
            sender_avatar: msg.sender_avatar || '/images/user.png',
            receiver_name: msg.receiver_name || msg.receiver_nickname || '用户',
            receiver_avatar: msg.receiver_avatar || '/images/user.png',
            created_at: this.formatTime(msg.created_at)
          };
        });
        
        console.log('处理后的消息列表:', messages);
        
        // 只在消息数量变化时才滚动到底部
        const shouldScroll = !this.data.messages || messages.length !== this.data.messages.length;
        
        this.setData({
          messages,
          scrollIntoView: shouldScroll ? `msg-${messages.length - 1}` : this.data.scrollIntoView
        });
      }
    } catch (error) {
      if (!silent) {
        wx.showToast({
          title: '加载消息失败',
          icon: 'none'
        });
      }
      console.error('加载消息失败:', error);
    }
  },

  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },

  async sendMessage() {
    const { inputMessage, orderId, otherUserId } = this.data;
    
    console.log('准备发送消息:', {
      orderId,
      otherUserId,
      content: inputMessage
    });
    
    if (!inputMessage || !inputMessage.trim()) {
      wx.showToast({
        title: '请输入消息内容',
        icon: 'none'
      });
      return;
    }

    if (!otherUserId) {
      wx.showToast({
        title: '接收者信息错误',
        icon: 'none'
      });
      console.error('otherUserId 未设置');
      return;
    }

    try {
      const res = await sendMessage({
        orderId,
        receiverId: otherUserId,
        content: inputMessage.trim(),
        type: 'text'
      });

      console.log('发送消息响应:', res);

      if (res.code === 0) {
        this.setData({ inputMessage: '' });
        // 立即刷新消息列表
        await this.loadMessages(true);
      } else {
        wx.showToast({
          title: res.message || '发送失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      });
    }
  },

  viewOrderDetail() {
    wx.navigateTo({
      url: `/pages/order/detail?id=${this.data.orderId}`
    });
  },

  requestCancel() {
    wx.navigateTo({
      url: `/pages/order/cancel-request?orderId=${this.data.orderId}`
    });
  }
});
