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
    },

    // 充值相关
    showRechargePanel: false,
    selectedAmount: null,
    customAmount: '',
    currentOrderNo: null,

    // 提现相关
    showWithdrawPanel: false,
    withdrawAmount: '',
    withdrawMethod: 'wechat',
    alipayAccount: ''
  },

  onLoad: function (options) {
    console.log('=== 钱包页面加载 ===');
    
    // 确保有必要的用户信息进行钱包操作
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!token) {
      wx.setStorageSync('token', 'demo_token_15');
      console.log('设置默认token');
    }
    
    if (!userInfo) {
      wx.setStorageSync('userInfo', { 
        id: 15, 
        username: 'user15',
        nickname: '用户15'
      });
      console.log('设置默认用户信息');
    }
    
    this.loadWalletInfo();
    this.loadWalletDetails();
  },

  onShow: function () {
    console.log('=== 钱包页面显示 ===');
    
    // 每次显示页面时重新加载钱包信息
    this.loadWalletInfo();
  },

  // 加载钱包信息
  loadWalletInfo: async function () {
    try {
      console.log('=== 开始加载钱包信息 ===');
      console.log('当前token:', wx.getStorageSync('token'));
      console.log('当前用户信息:', wx.getStorageSync('userInfo'));
      
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
      
      // 强制更新页面数据
      this.setData({
        walletInfo: newWalletInfo
      });
      
      console.log('✅ 钱包信息更新完成');
      
    } catch (error) {
      console.error('❌ 加载钱包信息失败:', error);
      wx.showToast({
        title: '加载钱包信息失败',
        icon: 'none',
        duration: 2000
      });
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

    // 先刷新钱包信息，再刷新明细
    this.loadWalletInfo().then(() => {
      console.log('钱包信息刷新完成，当前余额:', this.data.walletInfo.balance);
      return this.loadWalletDetails();
    }).then(() => {
      console.log('刷新完成');
      wx.stopPullDownRefresh();
    }).catch((error) => {
      console.error('刷新失败:', error);
      wx.stopPullDownRefresh();
    });
  },

  // 提现 - 显示提现面板
  onWithdraw: function () {
    const balance = parseFloat(this.data.walletInfo.balance);
    
    if (balance <= 0) {
      wx.showToast({
        title: '余额不足',
        icon: 'none'
      });
      return;
    }

    if (balance < 1) {
      wx.showToast({
        title: '余额不足1元，无法提现',
        icon: 'none'
      });
      return;
    }

    this.setData({
      showWithdrawPanel: true,
      showRechargePanel: false,
      withdrawAmount: '',
      withdrawMethod: 'wechat',
      alipayAccount: ''
    });
  },

  // 输入提现金额
  onWithdrawAmountInput: function (e) {
    this.setData({
      withdrawAmount: e.detail.value
    });
  },

  // 全部提现
  withdrawAll: function () {
    this.setData({
      withdrawAmount: this.data.walletInfo.balance
    });
  },

  // 选择提现方式
  selectWithdrawMethod: function (e) {
    this.setData({
      withdrawMethod: e.currentTarget.dataset.method
    });
  },

  // 输入支付宝账号
  onAlipayAccountInput: function (e) {
    this.setData({
      alipayAccount: e.detail.value
    });
  },

  // 取消提现
  cancelWithdraw: function () {
    this.setData({
      showWithdrawPanel: false,
      withdrawAmount: '',
      withdrawMethod: 'wechat',
      alipayAccount: ''
    });
  },

  // 确认提现
  confirmWithdraw: async function () {
    const amount = parseFloat(this.data.withdrawAmount);
    const balance = parseFloat(this.data.walletInfo.balance);
    const method = this.data.withdrawMethod;

    if (!amount || amount <= 0) {
      wx.showToast({
        title: '请输入提现金额',
        icon: 'none'
      });
      return;
    }

    if (amount < 1) {
      wx.showToast({
        title: '最低提现金额为1元',
        icon: 'none'
      });
      return;
    }

    if (amount > balance) {
      wx.showToast({
        title: '提现金额不能超过余额',
        icon: 'none'
      });
      return;
    }

    if (method === 'alipay' && !this.data.alipayAccount) {
      wx.showToast({
        title: '请输入支付宝账号',
        icon: 'none'
      });
      return;
    }

    // 确认提现
    wx.showModal({
      title: '确认提现',
      content: `提现金额：¥${amount.toFixed(2)}\n提现方式：${method === 'wechat' ? '微信' : '支付宝'}\n\n提交后金额将被冻结，管理员审核通过后到账`,
      confirmText: '确认',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          await this.doWithdraw(amount);
        }
      }
    });
  },

  // 执行提现
  doWithdraw: async function (amount) {
    try {
      wx.showLoading({ title: '提交中...' });
      
      const method = this.data.withdrawMethod;
      const account = method === 'wechat' ? '微信' : this.data.alipayAccount;
      
      // 使用提现申请API
      const result = await userAPI.createWithdrawRequest({
        amount,
        account: account,
        accountType: method
      });

      wx.hideLoading();
      
      if (result && result.success) {
        // 关闭提现面板
        this.setData({
          showWithdrawPanel: false,
          withdrawAmount: '',
          withdrawMethod: 'wechat',
          alipayAccount: ''
        });

        wx.showModal({
          title: '提现申请已提交',
          content: `提现金额：¥${amount.toFixed(2)}\n\n金额已冻结，管理员审核通过后将转入您的${method === 'wechat' ? '微信' : '支付宝'}账户，预计1-3个工作日到账`,
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
      } else {
        const errorMsg = (result && result.message) || '提现失败';
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }

    } catch (error) {
      wx.hideLoading();
      console.error('提现失败:', error);
      
      wx.showToast({
        title: error.message || '提现失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 查看提现记录
  onViewWithdrawList: function () {
    wx.navigateTo({
      url: '/pages/wallet/withdraw-list'
    });
  },

  // ========== 充值功能 ==========

  // 点击充值按钮
  onRecharge: function () {
    this.setData({
      showRechargePanel: true,
      selectedAmount: null,
      customAmount: ''
    });
  },

  // 选择充值金额
  selectAmount: function (e) {
    const amount = e.currentTarget.dataset.amount;
    this.setData({
      selectedAmount: amount,
      customAmount: amount === 'custom' ? '' : ''
    });
  },

  // 输入自定义金额
  onCustomAmountInput: function (e) {
    this.setData({
      customAmount: e.detail.value
    });
  },

  // 取消充值
  cancelRecharge: function () {
    this.setData({
      showRechargePanel: false,
      selectedAmount: null,
      customAmount: ''
    });
  },

  // 确认充值
  confirmRecharge: async function () {
    let amount = this.data.selectedAmount;
    
    if (amount === 'custom') {
      amount = parseFloat(this.data.customAmount);
    } else {
      amount = parseFloat(amount);
    }

    if (!amount || amount <= 0) {
      wx.showToast({
        title: '请选择或输入充值金额',
        icon: 'none'
      });
      return;
    }

    if (amount < 0.01) {
      wx.showToast({
        title: '最小充值金额为0.01元',
        icon: 'none'
      });
      return;
    }

    if (amount > 10000) {
      wx.showToast({
        title: '单次充值不能超过10000元',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '创建订单...' });

      // 1. 创建充值订单
      const result = await userAPI.createRechargeOrder(amount);
      
      if (!result || !result.success) {
        throw new Error(result?.message || '创建订单失败');
      }

      const orderData = result.data;
      this.setData({ currentOrderNo: orderData.orderNo });

      wx.hideLoading();

      // 2. 检查是否为模拟模式（开发环境）
      if (orderData.mockMode) {
        // 开发环境：显示模拟支付确认
        wx.showModal({
          title: '开发环境模拟支付',
          content: `充值金额：¥${amount.toFixed(2)}\n订单号：${orderData.orderNo}\n\n点击确定模拟支付成功`,
          confirmText: '确定支付',
          cancelText: '取消',
          success: async (res) => {
            if (res.confirm) {
              await this.mockPayment(orderData.orderNo);
            }
          }
        });
        return;
      }

      // 3. 调用微信支付
      await this.callWechatPay(orderData);

    } catch (error) {
      wx.hideLoading();
      console.error('充值失败:', error);
      wx.showToast({
        title: error.message || '充值失败',
        icon: 'none'
      });
    }
  },

  // 调用微信支付
  callWechatPay: function (orderData) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: orderData.timeStamp,
        nonceStr: orderData.nonceStr,
        package: orderData.package,
        signType: orderData.signType || 'MD5',
        paySign: orderData.paySign,
        success: async (res) => {
          console.log('微信支付成功:', res);
          
          // 支付成功，查询订单状态确认
          await this.checkPaymentResult(orderData.orderNo);
          resolve(res);
        },
        fail: (err) => {
          console.error('微信支付失败:', err);
          
          if (err.errMsg.includes('cancel')) {
            wx.showToast({
              title: '已取消支付',
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '支付失败',
              icon: 'none'
            });
          }
          reject(err);
        }
      });
    });
  },

  // 模拟支付（开发环境）
  mockPayment: async function (orderNo) {
    try {
      wx.showLoading({ title: '处理中...' });

      const result = await userAPI.mockPaySuccess(orderNo);

      wx.hideLoading();

      if (result && result.success) {
        wx.showToast({
          title: '充值成功',
          icon: 'success'
        });

        // 关闭充值面板，刷新数据
        this.setData({
          showRechargePanel: false,
          selectedAmount: null,
          customAmount: '',
          currentOrderNo: null
        });

        // 刷新钱包信息
        this.loadWalletInfo();
        this.setData({
          detailList: [],
          page: 1,
          hasMore: true
        });
        this.loadWalletDetails();
      } else {
        throw new Error(result?.message || '支付处理失败');
      }

    } catch (error) {
      wx.hideLoading();
      console.error('模拟支付失败:', error);
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      });
    }
  },

  // 检查支付结果
  checkPaymentResult: async function (orderNo) {
    try {
      // 轮询查询订单状态
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        const result = await userAPI.queryRechargeOrder(orderNo);
        
        if (result && result.success && result.data.status === 'paid') {
          wx.showToast({
            title: '充值成功',
            icon: 'success'
          });

          // 关闭充值面板，刷新数据
          this.setData({
            showRechargePanel: false,
            selectedAmount: null,
            customAmount: '',
            currentOrderNo: null
          });

          // 刷新钱包信息
          this.loadWalletInfo();
          this.setData({
            detailList: [],
            page: 1,
            hasMore: true
          });
          this.loadWalletDetails();
          return;
        }

        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 超时未确认，提示用户
      wx.showModal({
        title: '支付确认中',
        content: '支付结果确认中，请稍后刷新查看余额',
        showCancel: false
      });

    } catch (error) {
      console.error('查询支付结果失败:', error);
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