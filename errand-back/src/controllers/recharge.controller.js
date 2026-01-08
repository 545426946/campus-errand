const crypto = require('crypto');
const RechargeOrder = require('../models/RechargeOrder');
const paymentService = require('../services/payment.service');

/**
 * 生成订单号
 */
function generateOrderNo() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `RC${timestamp}${random}`;
}

/**
 * 创建充值订单（统一下单）
 * POST /api/recharge/create
 */
exports.createRechargeOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    // 验证金额
    const rechargeAmount = parseFloat(amount);
    if (!rechargeAmount || rechargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '充值金额必须大于0'
      });
    }

    if (rechargeAmount < 0.01) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '最小充值金额为0.01元'
      });
    }

    if (rechargeAmount > 10000) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '单次充值金额不能超过10000元'
      });
    }

    // 生成订单号
    const orderNo = generateOrderNo();

    // 创建充值订单记录
    const order = await RechargeOrder.create({
      userId,
      orderNo,
      amount: rechargeAmount,
      paymentMethod: 'wechat',
      status: 'pending'
    });

    // 调用微信支付统一下单
    const wechatPayParams = await createWechatPayOrder({
      orderNo,
      amount: rechargeAmount,
      userId,
      openid: req.user.openid // 用户的微信openid
    });

    res.json({
      success: true,
      code: 0,
      data: {
        orderNo,
        amount: rechargeAmount,
        ...wechatPayParams
      },
      message: '创建充值订单成功'
    });

  } catch (error) {
    console.error('创建充值订单失败:', error);
    next(error);
  }
};

/**
 * 调用微信支付统一下单API
 */
async function createWechatPayOrder({ orderNo, amount, userId, openid }) {
  const appId = process.env.WECHAT_APPID;
  const mchId = process.env.WECHAT_MCH_ID || '';
  const apiKey = process.env.WECHAT_API_KEY || '';
  const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL || '';

  // 如果没有配置微信支付，返回模拟数据（开发环境）
  if (!mchId || !apiKey) {
    console.log('⚠️ 微信支付未配置，使用模拟模式');
    return createMockPayParams(orderNo, amount, appId);
  }

  // 实际微信支付统一下单
  const nonceStr = generateNonceStr();
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  
  // 构建统一下单参数
  const unifiedOrderParams = {
    appid: appId,
    mch_id: mchId,
    nonce_str: nonceStr,
    body: '校园跑腿-账户充值',
    out_trade_no: orderNo,
    total_fee: Math.round(amount * 100), // 微信支付金额单位为分
    spbill_create_ip: '127.0.0.1',
    notify_url: notifyUrl,
    trade_type: 'JSAPI',
    openid: openid
  };

  // 生成签名
  const sign = generateWechatSign(unifiedOrderParams, apiKey);
  unifiedOrderParams.sign = sign;

  // TODO: 实际调用微信支付API
  // const result = await callWechatUnifiedOrder(unifiedOrderParams);
  
  // 返回小程序支付参数
  const payParams = {
    timeStamp,
    nonceStr,
    package: `prepay_id=mock_prepay_${orderNo}`,
    signType: 'MD5',
    paySign: generateWechatSign({
      appId,
      timeStamp,
      nonceStr,
      package: `prepay_id=mock_prepay_${orderNo}`,
      signType: 'MD5'
    }, apiKey)
  };

  return payParams;
}

/**
 * 创建模拟支付参数（开发环境使用）
 */
function createMockPayParams(orderNo, amount, appId) {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  
  return {
    // 标记为模拟模式
    mockMode: true,
    timeStamp,
    nonceStr,
    package: `prepay_id=mock_${orderNo}`,
    signType: 'MD5',
    paySign: 'MOCK_SIGN_' + orderNo
  };
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成微信支付签名
 */
function generateWechatSign(params, apiKey) {
  const sortedKeys = Object.keys(params).filter(k => params[k] && k !== 'sign').sort();
  const stringA = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  const stringSignTemp = `${stringA}&key=${apiKey}`;
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
}

/**
 * 微信支付回调通知
 * POST /api/recharge/notify
 */
exports.wechatPayNotify = async (req, res) => {
  try {
    console.log('=== 收到微信支付回调 ===');
    
    // 解析XML数据（实际应用中需要解析微信发送的XML）
    const notifyData = req.body;
    
    // 验证签名
    const apiKey = process.env.WECHAT_API_KEY || '';
    if (apiKey && notifyData.sign) {
      const isValid = verifyWechatSign(notifyData, apiKey);
      if (!isValid) {
        console.error('微信支付回调签名验证失败');
        return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>');
      }
    }

    const orderNo = notifyData.out_trade_no;
    const transactionId = notifyData.transaction_id;
    const resultCode = notifyData.result_code;

    if (resultCode === 'SUCCESS') {
      // 支付成功，更新订单状态和用户余额
      const result = await RechargeOrder.markAsPaidAndUpdateBalance(orderNo, transactionId);
      
      if (result.success) {
        console.log(`✅ 充值订单 ${orderNo} 处理成功`);
      }
    } else {
      // 支付失败
      await RechargeOrder.updateStatus(orderNo, 'failed', {
        failReason: notifyData.err_code_des || '支付失败'
      });
    }

    // 返回成功响应给微信
    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');

  } catch (error) {
    console.error('处理微信支付回调失败:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>');
  }
};

/**
 * 验证微信签名
 */
function verifyWechatSign(params, apiKey) {
  const sign = params.sign;
  const calculatedSign = generateWechatSign(params, apiKey);
  return sign === calculatedSign;
}

/**
 * 查询充值订单状态
 * GET /api/recharge/query/:orderNo
 */
exports.queryRechargeOrder = async (req, res, next) => {
  try {
    const { orderNo } = req.params;
    const userId = req.user.id;

    const order = await RechargeOrder.findByOrderNo(orderNo);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 验证订单归属
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权查看此订单'
      });
    }

    res.json({
      success: true,
      code: 0,
      data: {
        orderNo: order.order_no,
        amount: parseFloat(order.amount).toFixed(2),
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        paidAt: order.paid_at
      },
      message: '查询成功'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * 模拟支付成功（仅开发环境使用）
 * POST /api/recharge/mock-pay
 */
exports.mockPaySuccess = async (req, res, next) => {
  try {
    // 仅在开发环境允许
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '生产环境不允许模拟支付'
      });
    }

    const { orderNo } = req.body;
    const userId = req.user.id;

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '订单号不能为空'
      });
    }

    // 查找订单
    const order = await RechargeOrder.findByOrderNo(orderNo);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '订单不存在'
      });
    }

    // 验证订单归属
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权操作此订单'
      });
    }

    // 模拟支付成功
    const mockTransactionId = `MOCK_${Date.now()}`;
    const result = await RechargeOrder.markAsPaidAndUpdateBalance(orderNo, mockTransactionId);

    if (result.alreadyPaid) {
      return res.json({
        success: true,
        code: 0,
        data: result.data,
        message: '订单已支付'
      });
    }

    res.json({
      success: true,
      code: 0,
      data: result.data,
      message: '模拟支付成功'
    });

  } catch (error) {
    console.error('模拟支付失败:', error);
    next(error);
  }
};

/**
 * 获取用户充值记录
 * GET /api/recharge/list
 */
exports.getRechargeList = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, status } = req.query;

    const result = await RechargeOrder.getUserOrders(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status
    });

    const formattedList = result.list.map(item => ({
      orderNo: item.order_no,
      amount: parseFloat(item.amount).toFixed(2),
      status: item.status,
      statusText: getStatusText(item.status),
      paymentMethod: item.payment_method,
      createdAt: item.created_at,
      paidAt: item.paid_at
    }));

    res.json({
      success: true,
      code: 0,
      data: {
        list: formattedList,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore
      },
      message: '获取充值记录成功'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * 获取状态文本
 */
function getStatusText(status) {
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    failed: '支付失败',
    closed: '已关闭'
  };
  return statusMap[status] || status;
}
