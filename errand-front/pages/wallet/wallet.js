const app = getApp();
const userAPI = require('../../api/user.js');
const authUtil = require('../../utils/auth.js');

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
    console.log('=== 钱包页面加载 ===');
    console.log('登录状态:', authUtil.isLoggedIn());
    console.log('存储的token:', wx.getStorageSync('token'));
    
    // 检查登录状态
    if (!authUtil.isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后查看钱包',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      });
      return;
    }
    
    this.loadWalletInfo();
    this.loadWalletDetails();
  },

  onShow: function () {
    console.log('=== 钱包页面显示 ===');
    
    // 每次显示页面时检查登录状态
    if (!authUtil.isLoggedIn()) {
      console.log('未登录，跳过加载钱包信息');
      return;
    }
    
    // 强制重新加载钱包信息
    this.loadWalletInfo();
  },

  // 加载钱包信息
  loadWalletInfo: async function () {
    try {
      console.log('=== 开始加载钱包信息 ===');
      console.log('当前用户信息:', authUtil.getCurrentUser());
      console.log('当前token:', authUtil.getToken() ? authUtil.getToken().substring(0, 30) + '...' : '无');
      
      const result = await userAPI.getWalletInfo();
      console.log('钱包API原始响应:', JSON.stringify(result, null, 2));
      
      if (!result || !result.success || !result.data) {
        throw new Error('钱包数据格式错误');
      }
      
      // 确保数据是数字并格式化
      const balance = parseFloat(result.data.balance) || 0;
      const frozen = parseFloat(result.data.frozen) || 0;
      const total = parseFloat(result.data.total) || (balance + frozen);
      
      const newWalletInfo = {
        balance: balance.toFixed(2),
        frozen: frozen.toFixed(2),
        total: total.toFixed(2)
      };
      
      console.log('处理后的钱包信息:', newWalletInfo);
      
      // 关键：强制更新页面数据
      this.setData({
        walletInfo: newWalletInfo
      });
      
      console.log('✅ 钱包信息更新完成');
      console.log('页面当前数据:', this.data.walletInfo);
      
    } catch (error) {
      console.error('❌ 加载钱包信息失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      });
      
      // 如果是未登录错误，提示用户登录
      if (error.message && (error.message.includes('未授权') || error.message.includes('认证') || error.code === 401 || error.statusCode === 401)) {
        wx.showModal({
          title: '认证失败',
          content: '您的登录状态已过期，请重新登录',
          showCancel: false,
          confirmText: '重新登录',
          success: () => {
            authUtil.clearLoginInfo();
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        });
      } else {
        wx.showToast({
          title: '加载失败: ' + (error.message || '网络错误'),
          icon: 'none',
          duration: 3000
        });
      }
    }
  },

  // 加载钱包明细
  loadWalletDetails: async function (isLoadMore = false) {
    if (this.data.loading || (!this.data.hasMore && isLoadMore)) {
      return;
    }

    this.setData({ loading: true });

    try {
      console.log('=== 加载钱包明细 ===');
      
      const result = await userAPI.getWalletDetails({
        page: this.data.page,
        pageSize: 10
      });
      
      console.log('明细API响应:', JSON.stringify(result, null, 2));

      const newList = (result.data.list || []).map(item => ({
        ...item,
        createTime: this.formatTime(item.createTime)
      }));
      
      const existingList = isLoadMore ? this.data.detailList : [];

      this.setData({
        detailList: existingList.concat(newList),
        hasMore: newList.length === 10,
        page: this.data.page + 1,
        loading: false
      });

      console.log('✅ 钱包明细加载完成');

    } catch (error) {
      console.error('❌ 加载钱包明细失败:', error);
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
    console.log('=== 下拉刷新 ===');
    
    this.setData({
      detailList: [],
      page: 1,
      hasMore: true
    });

    Promise.all([
      this.loadWalletInfo(),
      this.loadWalletDetails()
    ]).then(() => {
      console.log('刷新完成');
      wx.stopPullDownRefresh();
    }).catch((error) => {
      console.error('刷新失败:', error);
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
          if (amount > 0 && amount <= 10000) { // 限制充值金额
            await this.doRecharge(amount);
          } else {
            wx.showToast({
              title: '请输入正确金额（1-10000）',
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
      console.log('=== 开始充值 ===');
      console.log('当前用户信息:', authUtil.getCurrentUser());
      console.log('当前token:', authUtil.getToken() ? authUtil.getToken().substring(0, 30) + '...' : '无');
      console.log('充值金额:', amount);
      
      wx.showLoading({ title: '充值处理中...' });
      
      const result = await userAPI.recharge({
        amount: amount,
        paymentMethod: 'wechat'
      });

      wx.hideLoading();
      
      console.log('充值API响应:', JSON.stringify(result, null, 2));
      
      if (result && result.success) {
        console.log('✅ 充值成功');
        
        const balanceBefore = result.data.balance_before || 0;
        const balanceAfter = result.data.balance_after || amount;
        
        // 显示成功信息
        wx.showModal({
          title: '充值成功',
          content: `充值金额：¥${amount.toFixed(2)}\n充值前余额：¥${balanceBefore.toFixed(2)}\n充值后余额：¥${balanceAfter.toFixed(2)}`,
          showCancel: false,
          success: () => {
            console.log('=== 开始刷新数据 ===');
            
            // 立即刷新钱包信息
            this.loadWalletInfo().then(() => {
              console.log('钱包信息刷新完成，当前余额:', this.data.walletInfo.balance);
              
              // 重置并重新加载明细
              this.setData({
                detailList: [],
                page: 1,
                hasMore: true
              });
              
              // 延迟加载明细，确保充值记录已生成
              setTimeout(() => {
                this.loadWalletDetails();
              }, 300);
            });
          }
        });
        
      } else {
        console.log('❌ 充值失败:', result);
        const errorMsg = (result && result.message) || '充值失败';
        
        // 特殊处理账户相关错误
        if (errorMsg.includes('用户') || errorMsg.includes('认证')) {
          wx.showModal({
            title: '账户错误',
            content: errorMsg + '\n\n建议重新登录',
            confirmText: '重新登录',
            success: (res) => {
              if (res.confirm) {
                authUtil.clearLoginInfo();
                wx.navigateTo({
                  url: '/pages/login/login'
                });
              }
            }
          });
        } else {
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          });
        }
      }

    } catch (error) {
      wx.hideLoading();
      console.error('❌ 充值异常:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      });
      
      let errorMessage = '充值失败';
      if (error.message && (error.message.includes('未授权') || error.code === 401 || error.statusCode === 401)) {
        errorMessage = '认证失败，请重新登录';
        wx.showModal({
          title: '认证失败',
          content: '您的登录状态已过期，请重新登录后重试',
          confirmText: '重新登录',
          success: (res) => {
            if (res.confirm) {
              authUtil.clearLoginInfo();
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }
          }
        });
        return;
      } else if (error.message && error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
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
        account: '微信'
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
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 86400000 * 7) {
      return Math.floor(diff / 86400000) + '天前';
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
});