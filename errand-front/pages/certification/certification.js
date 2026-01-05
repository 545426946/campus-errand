const certificationAPI = require('../../api/certification.js');

Page({
  data: {
    // 认证状态
    certStatus: 'none', // none, pending, approved, rejected
    isCertified: false,
    certDetail: null,

    // 表单数据
    form: {
      type: 'student', // student, teacher, staff
      realName: '',
      idCard: '',
      studentId: '',
      school: '',
      college: '',
      major: '',
      grade: '',
      department: '',
      idCardFront: '',
      idCardBack: '',
      studentCard: ''
    },

    // 认证类型选项
    typeOptions: [
      { value: 'student', label: '学生' },
      { value: 'teacher', label: '教师' },
      { value: 'staff', label: '职工' }
    ],

    loading: false,
    submitting: false
  },

  onLoad: function () {
    this.loadCertificationStatus();
  },

  onShow: function () {
    this.loadCertificationStatus();
  },

  // 加载认证状态
  async loadCertificationStatus() {
    this.setData({ loading: true });

    try {
      const res = await certificationAPI.getCertificationStatus();
      
      if (res.code === 0) {
        this.setData({
          certStatus: res.data.status,
          isCertified: res.data.isCertified,
          certDetail: res.data,
          loading: false
        });

        // 如果有待审核或已通过的认证，加载详情
        if (res.data.status !== 'none') {
          this.loadCertificationDetail();
        }
      }
    } catch (error) {
      console.error('加载认证状态失败:', error);
      this.setData({ loading: false });
    }
  },

  // 加载认证详情
  async loadCertificationDetail() {
    try {
      const res = await certificationAPI.getCertificationDetail();
      
      if (res.code === 0) {
        this.setData({
          form: {
            type: res.data.type,
            realName: res.data.real_name,
            idCard: res.data.id_card,
            studentId: res.data.student_id || '',
            school: res.data.school,
            college: res.data.college || '',
            major: res.data.major || '',
            grade: res.data.grade || '',
            department: res.data.department || '',
            idCardFront: res.data.id_card_front || '',
            idCardBack: res.data.id_card_back || '',
            studentCard: res.data.student_card || ''
          }
        });
      }
    } catch (error) {
      console.error('加载认证详情失败:', error);
    }
  },

  // 选择认证类型
  onTypeChange(e) {
    this.setData({
      'form.type': e.detail.value
    });
  },

  // 输入框变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  // 上传图片
  async onUploadImage(e) {
    const type = e.currentTarget.dataset.type;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadImageToServer(tempFilePath, type);
      }
    });
  },

  // 上传图片到服务器
  async uploadImageToServer(filePath, type) {
    wx.showLoading({ title: '上传中...' });

    try {
      const token = wx.getStorageSync('token');
      
      wx.uploadFile({
        url: `${require('../../utils/config.js').getApiConfig().baseUrl}/upload/image`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          
          if (data.code === 0) {
            this.setData({
              [`form.${type}`]: data.data.url
            });
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 预览图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;

    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  // 提交认证
  async onSubmit() {
    const { form } = this.data;

    // 验证必填字段
    if (!form.realName) {
      wx.showToast({ title: '请输入真实姓名', icon: 'none' });
      return;
    }

    if (!form.idCard) {
      wx.showToast({ title: '请输入身份证号', icon: 'none' });
      return;
    }

    if (!form.school) {
      wx.showToast({ title: '请输入学校名称', icon: 'none' });
      return;
    }

    // 验证身份证号格式
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardRegex.test(form.idCard)) {
      wx.showToast({ title: '身份证号格式不正确', icon: 'none' });
      return;
    }

    // 学生必须填写学号
    if (form.type === 'student' && !form.studentId) {
      wx.showToast({ title: '请输入学号', icon: 'none' });
      return;
    }

    // 确认提交
    const confirmResult = await new Promise((resolve) => {
      wx.showModal({
        title: '确认提交',
        content: '请确认您填写的信息准确无误，提交后将进入审核流程',
        success: (res) => resolve(res.confirm)
      });
    });

    if (!confirmResult) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    try {
      const res = await certificationAPI.submitCertification(form);
      
      if (res.code === 0) {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });

        setTimeout(() => {
          this.loadCertificationStatus();
        }, 1500);
      } else {
        wx.showToast({
          title: res.message || '提交失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('提交认证失败:', error);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
      wx.hideLoading();
    }
  },

  // 重新认证
  onReapply() {
    this.setData({
      certStatus: 'none',
      form: {
        ...this.data.form,
        idCardFront: '',
        idCardBack: '',
        studentCard: ''
      }
    });
  },

  // 查看历史记录
  onViewHistory() {
    wx.navigateTo({
      url: '/pages/certification/history'
    });
  }
});
