// 发布订单页面
const orderAPI = require('../../api/order.js');
const config = require('../../utils/config.js');

Page({
  data: {
    serviceTypes: [
      { id: 1, name: '快递代取' },
      { id: 2, name: '外卖配送' },
      { id: 3, name: '代购服务' },
      { id: 4, name: '其他服务' }
    ],
    typeIndex: 0,
    submitting: false,
    
    formData: {
      title: '',
      type: 1,
      description: '',
      pickupLocation: '',
      deliveryLocation: '',
      contactPhone: '',
      price: '',
      images: []
    }
  },

  // 输入事件处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    // 更新对应的表单字段
    this.setData({
      [`formData.${field}`]: value
    });
  },

  onLoad() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      });
    }
  },

  // 选择服务类型
  onTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      typeIndex: index,
      'formData.type': this.data.serviceTypes[index].id
    });
  },

  // 选择图片
  async onChooseImage() {
    try {
      const res = await wx.chooseImage({
        count: 9 - this.data.formData.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      const images = [...this.data.formData.images, ...res.tempFilePaths];
      
      this.setData({
        'formData.images': images
      });
      
    } catch (error) {
      console.error('选择图片失败:', error);
    }
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.formData.images.filter((_, i) => i !== index);
    
    this.setData({
      'formData.images': images
    });
  },

  // 预览图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    
    wx.previewImage({
      current: url,
      urls: this.data.formData.images
    });
  },

  // 表单验证
  validateForm(data) {
    if (!data.title || data.title.trim() === '') {
      wx.showToast({ title: '请输入订单标题', icon: 'none' });
      return false;
    }

    if (!data.description || data.description.trim() === '') {
      wx.showToast({ title: '请输入订单描述', icon: 'none' });
      return false;
    }

    if (!data.pickupLocation || data.pickupLocation.trim() === '') {
      wx.showToast({ title: '请输入取货地点', icon: 'none' });
      return false;
    }

    if (!data.deliveryLocation || data.deliveryLocation.trim() === '') {
      wx.showToast({ title: '请输入送达地点', icon: 'none' });
      return false;
    }

    if (!data.contactPhone || !/^1[3-9]\d{9}$/.test(data.contactPhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return false;
    }

    if (!data.price || parseFloat(data.price) <= 0) {
      wx.showToast({ title: '请输入正确的金额', icon: 'none' });
      return false;
    }

    return true;
  },

  // 提交表单
  async onSubmit(e) {
    try {
      const formData = e.detail.value;
      
      // 合并表单数据
      const submitData = {
        title: formData.title,
        type: this.data.formData.type,
        description: formData.description,
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        contactPhone: formData.contactPhone,
        price: parseFloat(formData.price),
        images: this.data.formData.images
      };

      // 验证表单
      if (!this.validateForm(submitData)) {
        return;
      }

      this.setData({ submitting: true });

      // 调用API发布订单
      const result = await orderAPI.createOrder(submitData);

      this.setData({ submitting: false });

      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 2000
      });

      // 添加成功动画（暂时禁用，避免查询节点错误）
      // const submitBtn = this.selectComponent('.submit-btn') || 
      //                  this.createSelectorQuery().select('.submit-btn');
      
      // 跳转到订单详情
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order/detail?id=${result.data.orderId}`
        });
      }, 2000);

    } catch (error) {
      this.setData({ submitting: false });
      console.error('发布订单失败:', error);

      wx.showToast({
        title: error.message || '发布失败',
        icon: 'none',
        duration: 2000
      });
    }
  }
});
