// 测试反馈 API
const commonAPI = require('../../api/common.js');

Page({
  data: {
    result: '',
    token: '',
    userInfo: null
  },

  onLoad: function() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    this.setData({
      token: token || '未登录',
      userInfo: userInfo
    });
  },

  // 测试获取反馈历史
  testGetHistory: async function() {
    console.log('=== 开始测试获取反馈历史 ===');
    
    try {
      wx.showLoading({ title: '测试中...' });
      
      const result = await commonAPI.getFeedbackHistory({
        page: 1,
        pageSize: 20
      });
      
      wx.hideLoading();
      
      console.log('API 返回结果:', result);
      
      this.setData({
        result: JSON.stringify(result, null, 2)
      });
      
      wx.showModal({
        title: '测试成功',
        content: `获取到 ${result.data.list.length} 条记录`,
        showCancel: false
      });
      
    } catch (error) {
      wx.hideLoading();
      
      console.error('测试失败:', error);
      
      this.setData({
        result: '错误: ' + error.message
      });
      
      wx.showModal({
        title: '测试失败',
        content: error.message,
        showCancel: false
      });
    }
  },

  // 测试提交反馈
  testSubmitFeedback: async function() {
    console.log('=== 开始测试提交反馈 ===');
    
    try {
      wx.showLoading({ title: '提交中...' });
      
      const result = await commonAPI.submitFeedback({
        type: 'bug',
        title: '测试反馈 - ' + new Date().toLocaleString(),
        content: '这是一条测试反馈，用于测试历史记录功能',
        contact: '13800138000',
        images: []
      });
      
      wx.hideLoading();
      
      console.log('提交结果:', result);
      
      this.setData({
        result: JSON.stringify(result, null, 2)
      });
      
      wx.showModal({
        title: '提交成功',
        content: '反馈ID: ' + result.data.feedbackId,
        showCancel: false
      });
      
    } catch (error) {
      wx.hideLoading();
      
      console.error('提交失败:', error);
      
      this.setData({
        result: '错误: ' + error.message
      });
      
      wx.showModal({
        title: '提交失败',
        content: error.message,
        showCancel: false
      });
    }
  }
});
