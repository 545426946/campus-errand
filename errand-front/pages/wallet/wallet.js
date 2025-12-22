const app = getApp();
const userAPI = require('../../api/user.js');

Page({
  data: {
    // 钱包信息
    walletInfo: {
      balance: '0.00',
      frozen: '0.00',
      total: '0.00'
    },
    
    // 明细列表
    detailList: [],
    loading: false,
    page: 1,
    hasMore: true,
    
    // 统计数据
    stats: {
      totalIncome: '0.00',
      totalExpense: '0.00',
      todayIncome: '0.00'
    }
  },

  onLoad: function (options) {
    this.loadWalletInfo();
    this.loadWalletDetails();
  },

  onShow: function () {
    this.loadWalletInfo();
  },

  // 加载钱包信息
  loadWalletInfo: async function () {
    try {
      const result = await userAPI.getWalletInfo();
      this.setData({
        walletInfo: {
          balance: (result.data.balance || 0).toFixed(2),
          frozen: (result.data.frozen || 0).toFixed(2),
          total: (result.data.total || 0).toFixed(2)
        }
      });
    } catch (error) {
      console.error('加载钱包信息失败:', error);
    }
  },

  // 加载钱包明细
  loadWalletDetails: async function (isLoadMore = false) {
    if (this.data.loading || (!this.data.hasMore && isLoadMore)) {
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await userAPI.getWalletDetails({
        page: this.data.page,
        pageSize: 10
      });

      const newList = result.data.list || [];
      const existingList = isLoadMore ? this.data.detailList : [];

      this.setData({
        detailList: existingList.concat(newList),
        hasMore: newList.length === 10,
        page: this.data.page + 1,
        loading: false
      });

    } catch (error) {
      console.error('加载钱包明细失败:', error);
      this.setData({ loading: false });
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 触底加载更多
  onReachBottom: function () {
    if (this.data.hasMore) {
      this.loadWalletDetails(true);
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      detailList: [],
      page: 1,
      hasMore: true
    });

    Promise.all([
      this.loadWalletInfo(),
      this.loadWalletDetails()
    ]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 充值
  onRecharge: function () {
    wx.showModal({
      title: '充值',
      content: '请输入充值金额',
      editable: true,
      placeholderText: '请输入金额',
      success: async (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content);
          if (amount > 0) {
            await this.doRecharge(amount);
          } else {
            wx.showToast({
              title: '请输入正确金额',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 执行充值
  doRecharge: async function (amount) {
    try {
      wx.showLoading({ title: '处理中...' });
      
      const result = await userAPI.recharge({
        amount,
        paymentMethod: 'wechat'
      });

      wx.hideLoading();
      
      wx.showModal({
        title: '充值成功',
        content: `充值金额：¥${amount.toFixed(2)}`,
        showCancel: false,
        success: () => {
          // 重新加载钱包信息
          this.loadWalletInfo();
          this.setData({
            detailList: [],
            page: 1,
            hasMore: true
          });
          this.loadWalletDetails();
        }
      });

    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '充值失败',
        icon: 'none'
      });
    }
  },

  // 提现
  onWithdraw: function () {
    const balance = parseFloat(this.data.walletInfo.balance);
    
    if (balance <= 0) {
      wx.showToast({
        title: '余额不足',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '提现',
      content: `当前余额：¥${balance.toFixed(2)}\n请输入提现金额`,
      editable: true,
      placeholderText: '请输入金额',
      success: async (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content);
          if (amount > 0 && amount <= balance) {
            await this.doWithdraw(amount);
          } else {
            wx.showToast({
              title: '请输入正确金额',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 执行提现
  doWithdraw: async function (amount) {
    try {
      wx.showLoading({ title: '处理中...' });
      
      const result = await userAPI.withdraw({
        amount,
        account: '微信' // 简化版
      });

      wx.hideLoading();
      
      wx.showModal({
        title: '提现申请已提交',
        content: `提现金额：¥${amount.toFixed(2)}\n预计1-3个工作日到账`,
        showCancel: false,
        success: () => {
          // 重新加载钱包信息
          this.loadWalletInfo();
          this.setData({
            detailList: [],
            page: 1,
            hasMore: true
          });
          this.loadWalletDetails();
        }
      });

    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '提现失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间
  formatTime: function (timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else {
      return date.toLocaleDateString();
    }
  }
});