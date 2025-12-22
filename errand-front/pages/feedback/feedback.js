const commonAPI = require('../../api/common.js');

Page({
  data: {
    // 反馈类型
    feedbackTypes: [
      { id: 'bug', name: 'Bug反馈', icon: '🐛' },
      { id: 'feature', name: '功能建议', icon: '💡' },
      { id: 'complaint', name: '投诉建议', icon: '⚠️' },
      { id: 'other', name: '其他问题', icon: '❓' }
    ],
    
    // 选中的反馈类型
    selectedType: null,
    
    // 表单数据
    formData: {
      type: '',
      title: '',
      content: '',
      contact: '',
      images: []
    },
    
    // 提交状态
    submitting: false,
    
    // 错误提示
    errors: {}
  },

  onLoad: function (options) {
    // 设置默认类型
    this.setData({
      selectedType: this.data.feedbackTypes[0],
      'formData.type': this.data.feedbackTypes[0].id
    });
  },

  // 选择反馈类型
  selectType: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedType: type,
      'formData.type': type.id
    });
  },

  // 输入框变化
  onInputChange: function (e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: ''
    });
  },

  // 上传图片
  onUploadImage: function () {
    const remainingCount = 4 - this.data.formData.images.length;
    
    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const newImages = [...this.data.formData.images, ...tempFilePaths];
        
        this.setData({
          'formData.images': newImages
        });
      }
    });
  },

  // 预览图片
  onPreviewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.formData.images,
      current: url
    });
  },

  // 删除图片
  onDeleteImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.formData.images];
    images.splice(index, 1);
    
    this.setData({
      'formData.images': images
    });
  },

  // 验证表单
  validateForm: function () {
    const { formData } = this.data;
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = '请输入反馈标题';
    } else if (formData.title.length > 50) {
      errors.title = '标题长度不能超过50个字符';
    }

    if (!formData.content.trim()) {
      errors.content = '请输入反馈内容';
    } else if (formData.content.length < 10) {
      errors.content = '反馈内容至少10个字符';
    } else if (formData.content.length > 500) {
      errors.content = '反馈内容不能超过500个字符';
    }

    if (formData.contact && !this.validateContact(formData.contact)) {
      errors.contact = '请输入正确的联系方式';
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 验证联系方式
  validateContact: function (contact) {
    // 简单验证手机号或邮箱
    const phoneRegex = /^1[3-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phoneRegex.test(contact) || emailRegex.test(contact);
  },

  // 提交反馈
  onSubmitFeedback: async function () {
    if (this.data.submitting) return;

    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });

    try {
      wx.showLoading({ title: '提交中...' });

      const result = await commonAPI.submitFeedback({
        type: this.data.formData.type,
        title: this.data.formData.title,
        content: this.data.formData.content,
        contact: this.data.formData.contact,
        images: this.data.formData.images
      });

      wx.hideLoading();

      wx.showModal({
        title: '提交成功',
        content: '感谢您的反馈，我们会尽快处理并回复您。',
        showCancel: false,
        success: () => {
          // 清空表单
          this.setData({
            formData: {
              type: this.data.selectedType.id,
              title: '',
              content: '',
              contact: '',
              images: []
            },
            errors: {}
          });
        }
      });

    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 查看反馈记录
  onViewHistory: function () {
    wx.navigateTo({
      url: '/pages/feedback/history'
    });
  }
});