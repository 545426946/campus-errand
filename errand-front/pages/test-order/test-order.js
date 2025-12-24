const orderAPI = require('../../api/order.js');

Page({
  data: {
    loading: false
  },

  onLoad: function() {
    console.log('测试订单页面加载');
  },

  // 创建测试订单
  createTestOrder: async function() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const orderData = {
        title: '测试订单 - ' + new Date().toLocaleTimeString(),
        description: '这是一个测试订单，用于验证订单列表功能',
        type: 'delivery',
        pickupLocation: '学校北门',
        deliveryLocation: '学生宿舍',
        price: 5.00,
        contactPhone: '13800138000'
      };

      console.log('创建测试订单数据:', orderData);
      
      const result = await orderAPI.createOrder(orderData);
      
      console.log('创建订单成功:', result);
      
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });
      
      // 延迟跳转到订单页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/order/order'
        });
      }, 1500);
      
    } catch (error) {
      console.error('创建测试订单失败:', error);
      wx.showToast({
        title: error.message || '创建失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 跳转到订单页面
  goToOrders: function() {
    wx.switchTab({
      url: '/pages/order/order'
    });
  }
});