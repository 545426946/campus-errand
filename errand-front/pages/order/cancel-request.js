const { requestCancelOrder } = require('../../api/message.js');

Page({
  data: {
    orderId: null,
    reason: ''
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
    }
  },

  onReasonInput(e) {
    this.setData({ reason: e.detail.value });
  },

  async submitRequest() {
    const { orderId, reason } = this.data;

    if (!reason || !reason.trim()) {
      wx.showToast({
        title: '请输入取消原因',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '提交中...' });
      
      const res = await requestCancelOrder(orderId, reason.trim());
      
      wx.hideLoading();

      if (res.code === 0) {
        wx.showToast({
          title: '申请已提交',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.message || '提交失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交取消申请失败:', error);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    }
  }
});
