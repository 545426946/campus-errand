const userAPI = require('../../api/user.js');

Page({
  data: {
    withdrawList: [],
    loading: false,
    page: 1,
    hasMore: true,
    
    // 状态筛选
    statusFilter: 'all', // all, pending, approved, completed, rejected, cancelled
    statusMap: {
      all: '全部',
      pending: '待审核',
      approved: '已批准',
      completed: '已完成',
      rejected: '已拒绝',
      cancelled: '已取消'
    },
    
    // 统计数据
    stats: {
      totalCount: 0,
      pendingCount: 0,
      completedCount: 0,
      totalAmount: '0.00'
    }
  },

  onLoad: function () {
    this.loadWithdrawList();
    this.loadStats();
  },

  // 加载提现列表
  loadWithdrawList: async function (isLoadMore = false) {
    if (this.data.loading || (!this.data.hasMore && isLoadMore)) {
      return;
    }

    this.setData({ loading: true });

    try {
      const status = this.data.statusFilter === 'all' ? undefined : this.data.statusFilter;
      
      const result = await userAPI.getMyWithdrawRequests({
        page: this.data.page,
        pageSize: 10,
        status
      });

      const newList = (result.data.list || []).map(item => ({
        ...item,
        created_at: this.formatTime(item.created_at),
        statusText: this.data.statusMap[item.status] || item.status,
        statusClass: this.getStatusClass(item.status)
      }));

      const existingList = isLoadMore ? this.data.withdrawList : [];

      this.setData({
        withdrawList: existingList.concat(newList),
        hasMore: newList.length === 10,
        page: this.data.page + 1,
        loading: false
      });

    } catch (error) {
      console.error('加载提现列表失败:', error);
      this.setData({ loading: false });
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 加载统计数据
  loadStats: async function () {
    try {
      const result = await userAPI.getWithdrawStats();
      
      if (result && result.success) {
        this.setData({
          stats: {
            totalCount: result.data.total_count || 0,
            pendingCount: result.data.pending_count || 0,
            completedCount: result.data.completed_count || 0,
            totalAmount: parseFloat(result.data.total_amount || 0).toFixed(2)
          }
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 切换状态筛选
  onStatusChange: function (e) {
    const status = e.currentTarget.dataset.status;
    
    if (status === this.data.statusFilter) {
      return;
    }

    this.setData({
      statusFilter: status,
      withdrawList: [],
      page: 1,
      hasMore: true
    });

    this.loadWithdrawList();
  },

  // 查看详情
  onViewDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/wallet/withdraw-detail?id=${id}`
    });
  },

  // 取消提现
  onCancelWithdraw: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这笔提现申请吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });
            
            const result = await userAPI.cancelWithdrawRequest(id);
            
            wx.hideLoading();
            
            if (result && result.success) {
              wx.showToast({
                title: '已取消',
                icon: 'success'
              });
              
              // 刷新列表
              this.setData({
                withdrawList: [],
                page: 1,
                hasMore: true
              });
              this.loadWithdrawList();
              this.loadStats();
            }
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      withdrawList: [],
      page: 1,
      hasMore: true
    });

    Promise.all([
      this.loadWithdrawList(),
      this.loadStats()
    ]).then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 触底加载更多
  onReachBottom: function () {
    if (this.data.hasMore) {
      this.loadWithdrawList(true);
    }
  },

  // 获取状态样式类
  getStatusClass: function (status) {
    const classMap = {
      pending: 'status-pending',
      approved: 'status-approved',
      completed: 'status-completed',
      rejected: 'status-rejected',
      cancelled: 'status-cancelled'
    };
    return classMap[status] || '';
  },

  // 格式化时间
  formatTime: function (timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
});
