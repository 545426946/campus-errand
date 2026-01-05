const certificationAPI = require('../../api/certification.js');

Page({
  data: {
    historyList: [],
    filteredList: [],
    loading: false,
    activeFilter: 'all', // all, today, week, month
    stats: {
      total: 0,
      today: 0,
      week: 0,
      month: 0
    }
  },

  onLoad: function () {
    this.loadHistory();
  },

  // 加载历史记录
  async loadHistory() {
    this.setData({ loading: true });

    try {
      const res = await certificationAPI.getCertificationHistory();
      
      if (res.code === 0) {
        // 格式化时间
        const formattedList = res.data.map(item => ({
          ...item,
          submitted_at: this.formatTime(item.submitted_at),
          reviewed_at: item.reviewed_at ? this.formatTime(item.reviewed_at) : null,
          submitted_timestamp: new Date(item.submitted_at).getTime()
        }));

        // 计算统计数据
        const stats = this.calculateStats(formattedList);

        this.setData({
          historyList: formattedList,
          filteredList: formattedList,
          stats: stats,
          loading: false
        });
      } else {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 计算统计数据
  calculateStats(list) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      total: list.length,
      today: list.filter(item => item.submitted_timestamp >= todayStart).length,
      week: list.filter(item => item.submitted_timestamp >= weekStart).length,
      month: list.filter(item => item.submitted_timestamp >= monthStart).length
    };
  },

  // 切换筛选
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    this.filterList(filter);
  },

  // 筛选列表
  filterList(filter) {
    const { historyList } = this.data;
    
    if (filter === 'all') {
      this.setData({ filteredList: historyList });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let filtered = [];
    switch (filter) {
      case 'today':
        filtered = historyList.filter(item => item.submitted_timestamp >= todayStart);
        break;
      case 'week':
        filtered = historyList.filter(item => item.submitted_timestamp >= weekStart);
        break;
      case 'month':
        filtered = historyList.filter(item => item.submitted_timestamp >= monthStart);
        break;
    }

    this.setData({ filteredList: filtered });
  },

  // 格式化时间
  formatTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 查看详情
  onViewDetail(e) {
    const item = e.currentTarget.dataset.item;
    
    // 构建详情信息
    let content = `认证类型：${item.type === 'student' ? '学生' : item.type === 'teacher' ? '教师' : '职工'}\n`;
    content += `真实姓名：${item.real_name}\n`;
    content += `身份证号：${item.id_card}\n`;
    content += `学校：${item.school}\n`;
    
    if (item.student_id) {
      content += `${item.type === 'student' ? '学号' : '工号'}：${item.student_id}\n`;
    }
    
    if (item.college) {
      content += `学院：${item.college}\n`;
    }
    
    if (item.major) {
      content += `专业：${item.major}\n`;
    }
    
    if (item.grade) {
      content += `年级：${item.grade}\n`;
    }
    
    if (item.department) {
      content += `部门：${item.department}\n`;
    }
    
    content += `\n提交时间：${item.submitted_at}`;
    
    if (item.reviewed_at) {
      content += `\n审核时间：${item.reviewed_at}`;
    }
    
    if (item.status === 'rejected' && item.reject_reason) {
      content += `\n拒绝原因：${item.reject_reason}`;
    }

    wx.showModal({
      title: '认证详情',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 重新认证
  onReapply() {
    wx.showModal({
      title: '重新认证',
      content: '是否返回认证页面重新提交申请？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHistory().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
