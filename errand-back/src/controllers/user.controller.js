const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

// 获取用户信息
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      code: 0,
      data: user,
      message: '获取用户信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
exports.updateUserInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await User.updateUserInfo(userId, updateData);

    res.json({
      success: true,
      code: 0,
      data: user,
      message: '更新用户信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取钱包信息
exports.getWalletInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在'
      });
    }

    const balance = parseFloat(user.balance) || 0;
    const frozen = parseFloat(user.frozen_balance) || 0;
    const totalIncome = parseFloat(user.total_income) || 0;
    const totalExpense = parseFloat(user.total_expense) || 0;

    res.json({
      success: true,
      code: 0,
      data: {
        balance: balance.toFixed(2),
        frozen: frozen.toFixed(2),
        total: (balance + frozen).toFixed(2),
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2)
      },
      message: '获取钱包信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户资料
exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.updateProfile(req.user.id, req.body);
    
    res.json({
      success: true,
      code: 0,
      data: user,
      message: '更新资料成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取学习进度
exports.getLearningProgress = async (req, res, next) => {
  try {
    const progress = await User.getLearningProgress(req.user.id);
    
    res.json({
      success: true,
      code: 0,
      data: progress,
      message: '获取学习进度成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取头像
exports.getAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      code: 0,
      data: { avatar: user.avatar || '' },
      message: '获取头像成功'
    });
  } catch (error) {
    next(error);
  }
};

// 更新头像
exports.updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    
    await User.updateUserInfo(req.user.id, { avatar });
    
    res.json({
      success: true,
      code: 0,
      data: { avatar },
      message: '更新头像成功'
    });
  } catch (error) {
    next(error);
  }
};

// 提交实名认证
exports.submitCertification = async (req, res, next) => {
  try {
    const { realName, idCard, idCardFront, idCardBack } = req.body;
    
    if (!realName || !idCard) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供真实姓名和身份证号'
      });
    }
    
    // 简化版：直接标记为已认证
    await User.updateUserInfo(req.user.id, {
      real_name: realName,
      id_card: idCard,
      certification_status: 'verified'
    });
    
    res.json({
      success: true,
      code: 0,
      message: '实名认证提交成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取认证状态
exports.getCertificationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      code: 0,
      data: {
        status: user.certification_status || 'none',
        realName: user.real_name || ''
      },
      message: '获取认证状态成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取认证信息
exports.getCertificationInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      code: 0,
      data: {
        realName: user.real_name || '',
        idCard: user.id_card ? user.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : '',
        status: user.certification_status || 'none'
      },
      message: '获取认证信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取钱包明细
exports.getWalletDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, type } = req.query;

    const result = await WalletTransaction.getUserTransactions(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      type
    });

    // 格式化数据
    const formattedList = result.list.map(item => ({
      id: item.id,
      type: item.type,
      amount: parseFloat(item.amount).toFixed(2),
      title: item.title,
      description: item.description,
      createTime: item.created_at,
      status: item.status,
      balanceBefore: parseFloat(item.balance_before).toFixed(2),
      balanceAfter: parseFloat(item.balance_after).toFixed(2),
      orderId: item.order_id
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
      message: '获取钱包明细成功'
    });
  } catch (error) {
    next(error);
  }
};

// 提现
exports.withdraw = async (req, res, next) => {
  try {
    const { amount, account } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '提现金额必须大于0'
      });
    }

    // 检查用户余额
    const user = await User.findById(req.user.id);
    const currentBalance = parseFloat(user.balance) || 0;

    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '余额不足'
      });
    }

    // 执行提现操作
    const result = await WalletTransaction.updateUserBalance(
      req.user.id,
      amount,
      'withdraw',
      {
        title: '账户提现',
        description: `提现到${account || '微信'} ¥${amount}`,
        status: 'pending' // 提现通常需要审核
      }
    );

    res.json({
      success: true,
      code: 0,
      data: {
        amount: parseFloat(amount),
        account: account || '微信',
        balance_before: result.balance_before,
        balance_after: result.balance_after,
        transaction_id: result.id
      },
      message: '提现申请已提交，预计1-3个工作日到账'
    });
  } catch (error) {
    next(error);
  }
};

// 充值
exports.recharge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod = 'wechat' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '充值金额必须大于0'
      });
    }

    if (amount > 10000) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '单次充值金额不能超过10000元'
      });
    }

    // 模拟微信支付流程
    // 实际应用中需要调用微信支付API
    const paymentOrderId = `WX${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // 执行充值操作
    const result = await WalletTransaction.updateUserBalance(
      userId,
      amount,
      'recharge',
      {
        title: '账户充值',
        description: `通过${paymentMethod === 'wechat' ? '微信' : '支付宝'}充值 ¥${amount}`,
        status: 'completed'
      }
    );

    // 更新用户累计收入
    await User.updateUserInfo(userId, {
      total_income: result.balance_after
    });

    res.json({
      success: true,
      code: 0,
      data: {
        orderId: paymentOrderId,
        amount: parseFloat(amount),
        paymentMethod,
        balance_before: result.balance_before,
        balance_after: result.balance_after,
        transaction_id: result.id
      },
      message: '充值成功'
    });
  } catch (error) {
    console.error('充值失败:', error);
    next(error);
  }
};

// 获取历史记录
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    // 简化版：返回空列表
    res.json({
      success: true,
      code: 0,
      data: {
        list: [],
        total: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      message: '获取历史记录成功'
    });
  } catch (error) {
    next(error);
  }
};

// 删除历史记录
exports.deleteHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      code: 0,
      message: '删除历史记录成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
