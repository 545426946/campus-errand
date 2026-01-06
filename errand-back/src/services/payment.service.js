const crypto = require('crypto');
const axios = require('axios');

/**
 * 支付服务
 * 集成微信支付、支付宝等第三方支付
 */
class PaymentService {
  constructor() {
    // 微信支付配置（从环境变量读取）
    this.wechatConfig = {
      appId: process.env.WECHAT_APP_ID || '',
      mchId: process.env.WECHAT_MCH_ID || '',
      apiKey: process.env.WECHAT_API_KEY || '',
      notifyUrl: process.env.WECHAT_NOTIFY_URL || ''
    };
  }

  /**
   * 创建微信支付订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 支付参数
   */
  async createWechatPayment(orderData) {
    const { orderId, amount, description, userId } = orderData;

    // 模拟微信支付统一下单
    // 实际应用中需要调用微信支付API
    const paymentOrder = {
      prepayId: `prepay_${Date.now()}`,
      orderId: orderId,
      amount: amount,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: this.generateNonceStr(),
      package: `prepay_id=prepay_${Date.now()}`,
      signType: 'MD5'
    };

    // 生成签名
    paymentOrder.paySign = this.generateWechatSign(paymentOrder);

    return {
      success: true,
      data: paymentOrder,
      message: '创建支付订单成功'
    };
  }

  /**
   * 验证微信支付回调
   * @param {Object} callbackData - 回调数据
   * @returns {Boolean} 验证结果
   */
  verifyWechatCallback(callbackData) {
    // 实际应用中需要验证签名
    return true;
  }

  /**
   * 创建支付宝支付订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 支付参数
   */
  async createAlipayPayment(orderData) {
    // 模拟支付宝支付
    return {
      success: true,
      data: {
        orderId: orderData.orderId,
        payUrl: `alipay://pay?orderId=${orderData.orderId}`
      },
      message: '创建支付订单成功'
    };
  }

  /**
   * 处理提现请求
   * @param {Object} withdrawData - 提现数据
   * @returns {Promise<Object>} 处理结果
   */
  async processWithdraw(withdrawData) {
    const { userId, amount, account, accountType = 'wechat' } = withdrawData;

    // 模拟提现处理
    // 实际应用中需要调用微信企业付款或支付宝转账API
    const withdrawOrder = {
      orderId: `WD${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount,
      account,
      accountType,
      status: 'pending', // pending: 待处理, processing: 处理中, completed: 已完成, failed: 失败
      createdAt: new Date()
    };

    return {
      success: true,
      data: withdrawOrder,
      message: '提现申请已提交'
    };
  }

  /**
   * 查询支付订单状态
   * @param {String} orderId - 订单ID
   * @returns {Promise<Object>} 订单状态
   */
  async queryPaymentStatus(orderId) {
    // 模拟查询支付状态
    return {
      success: true,
      data: {
        orderId,
        status: 'paid', // unpaid: 未支付, paid: 已支付, closed: 已关闭
        paidAt: new Date()
      }
    };
  }

  /**
   * 退款
   * @param {Object} refundData - 退款数据
   * @returns {Promise<Object>} 退款结果
   */
  async refund(refundData) {
    const { orderId, amount, reason } = refundData;

    // 模拟退款处理
    return {
      success: true,
      data: {
        refundId: `RF${Date.now()}`,
        orderId,
        amount,
        reason,
        status: 'success'
      },
      message: '退款成功'
    };
  }

  /**
   * 生成随机字符串
   * @param {Number} length - 长度
   * @returns {String} 随机字符串
   */
  generateNonceStr(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成微信支付签名
   * @param {Object} params - 参数
   * @returns {String} 签名
   */
  generateWechatSign(params) {
    // 实际应用中需要按照微信支付规则生成签名
    const stringA = Object.keys(params)
      .filter(key => key !== 'paySign')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringSignTemp = `${stringA}&key=${this.wechatConfig.apiKey}`;
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  }

  /**
   * 验证签名
   * @param {Object} params - 参数
   * @param {String} sign - 签名
   * @returns {Boolean} 验证结果
   */
  verifySign(params, sign) {
    const calculatedSign = this.generateWechatSign(params);
    return calculatedSign === sign;
  }
}

module.exports = new PaymentService();
