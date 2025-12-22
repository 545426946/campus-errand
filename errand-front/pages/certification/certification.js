const app = getApp();
const userAPI = require('../../api/user.js');

Page({
  data: {
    // 认证状态
    certificationStatus: 'none', // none, pending, verified, rejected
    certificationInfo: {
      realName: '',
      idCard: '',
      statusText: '未认证'
    },
    
    // 表单数据
    formData: {
      realName: '',
      idCard: '',
      idCardFront: '',
      idCardBack: ''
    },
    
    // 提交状态
    submitting: false,
    
    // 认证步骤
    currentStep: 1, // 1: 填写信息, 2: 上传照片, 3: 提交审核
    
    // 错误提示
    errors: {}
  },

  onLoad: function (options) {
    this.loadCertificationInfo();
  },

  // 加载认证信息
  loadCertificationInfo: async function () {
    try {
      const result = await userAPI.getCertificationInfo();
      
      this.setData({
        certificationInfo: result.data,
        certificationStatus: result.data.status,
        formData: {
          realName: result.data.realName || '',
          idCard: result.data.idCard || '',
          idCardFront: '',
          idCardBack: ''
        }
      });

      // 如果已经认证，跳转到结果页面
      if (result.data.status === 'verified') {
        this.setData({ currentStep: 4 });
      } else if (result.data.status === 'pending') {
        this.setData({ currentStep: 3 });
      }

    } catch (error) {
      console.error('加载认证信息失败:', error);
    }
  },

  // 下一步
  onNextStep: function () {
    if (this.validateCurrentStep()) {
      this.setData({
        currentStep: this.data.currentStep + 1
      });
    }
  },

  // 上一步
  onPrevStep: function () {
    this.setData({
      currentStep: this.data.currentStep - 1
    });
  },

  // 验证当前步骤
  validateCurrentStep: function () {
    const { currentStep, formData } = this.data;
    const errors = {};

    if (currentStep === 1) {
      if (!formData.realName.trim()) {
        errors.realName = '请输入真实姓名';
      } else if (formData.realName.length < 2 || formData.realName.length > 20) {
        errors.realName = '姓名长度应在2-20个字符之间';
      }

      if (!formData.idCard.trim()) {
        errors.idCard = '请输入身份证号';
      } else if (!this.validateIdCard(formData.idCard)) {
        errors.idCard = '请输入正确的身份证号';
      }
    }

    this.setData({ errors });

    return Object.keys(errors).length === 0;
  },

  // 验证身份证号
  validateIdCard: function (idCard) {
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
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

  // 上传身份证正面
  onUploadIdCardFront: function () {
    this.chooseImage((filePath) => {
      this.setData({
        'formData.idCardFront': filePath
      });
    });
  },

  // 上传身份证背面
  onUploadIdCardBack: function () {
    this.chooseImage((filePath) => {
      this.setData({
        'formData.idCardBack': filePath
      });
    });
  },

  // 选择图片
  chooseImage: function (callback) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        callback(tempFilePaths[0]);
      },
      fail: (error) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览图片
  onPreviewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  // 删除图片
  onDeleteImage: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: ''
    });
  },

  // 提交认证
  onSubmitCertification: async function () {
    if (this.data.submitting) return;

    // 最终验证
    if (!this.validateCurrentStep()) {
      return;
    }

    if (!this.data.formData.idCardFront || !this.data.formData.idCardBack) {
      wx.showToast({
        title: '请上传身份证正反面照片',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      wx.showLoading({ title: '提交中...' });

      const result = await userAPI.certifyUser({
        realName: this.data.formData.realName,
        idCard: this.data.formData.idCard,
        idCardFront: this.data.formData.idCardFront,
        idCardBack: this.data.formData.idCardBack
      });

      wx.hideLoading();

      wx.showModal({
        title: '提交成功',
        content: '实名认证信息已提交，我们将在1-3个工作日内完成审核，请耐心等待。',
        showCancel: false,
        success: () => {
          this.setData({
            currentStep: 3,
            certificationStatus: 'pending'
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

  // 重新认证
  onReCertify: function () {
    this.setData({
      currentStep: 1,
      certificationStatus: 'none',
      formData: {
        realName: '',
        idCard: '',
        idCardFront: '',
        idCardBack: ''
      },
      errors: {}
    });
  },

  // 查看认证结果
  onViewResult: function () {
    wx.navigateTo({
      url: '/pages/certification/result'
    });
  }
});