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
    // 模拟数据，用于测试
    const mockBalance = 150.50;
    const mockFrozen = 20.00;
    const mockTotal = mockBalance + mockFrozen;

    res.json({
      success: true,
      code: 0,
      data: {
        balance: mockBalance,
        frozen: mockFrozen,
        total: mockTotal
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
    const { page = 1, pageSize = 20, type } = req.query;
    
    // 模拟交易记录数据
    const mockTransactions = [
      {
        id: 1,
        type: 'recharge',
        amount: 100.00,
        title: '账户充值',
        description: '通过微信充值 ¥100.00',
        createTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
        status: 'completed',
        balanceBefore: 50.50,
        balanceAfter: 150.50
      },
      {
        id: 2,
        type: 'income',
        amount: 15.00,
        title: '订单收入',
        description: '完成跑腿订单获得收入',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
        status: 'completed',
        balanceBefore: 35.50,
        balanceAfter: 50.50
      },
      {
        id: 3,
        type: 'expense',
        amount: 5.00,
        title: '服务费',
        description: '平台服务费扣除',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1天前
        status: 'completed',
        balanceBefore: 40.50,
        balanceAfter: 35.50
      },
      {
        id: 4,
        type: 'recharge',
        amount: 50.00,
        title: '账户充值',
        description: '通过微信充值 ¥50.00',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2天前
        status: 'completed',
        balanceBefore: 0,
        balanceAfter: 50.00
      }
    ];

    // 根据类型过滤
    let filteredTransactions = mockTransactions;
    if (type) {
      filteredTransactions = mockTransactions.filter(t => t.type === type);
    }

    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedList = filteredTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      code: 0,
      data: {
        list: paginatedList,
        total: filteredTransactions.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        hasMore: endIndex < filteredTransactions.length
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
    const { amount, paymentMethod } = req.body;
    
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

    // 模拟充值成功
    const balanceBefore = 150.50;
    const balanceAfter = balanceBefore + parseFloat(amount);

    res.json({
      success: true,
      code: 0,
      data: {
        orderId: `recharge_${Date.now()}`,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || 'wechat',
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        transaction_id: Date.now()
      },
      message: '充值成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取收藏列表
exports.getFavorites = async (req, res, next) => {
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
      message: '获取收藏列表成功'
    });
  } catch (error) {
    next(error);
  }
};

// 添加收藏
exports.addFavorite = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供订单ID'
      });
    }
    
    res.json({
      success: true,
      code: 0,
      message: '收藏成功'
    });
  } catch (error) {
    next(error);
  }
};

// 取消收藏
exports.removeFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      code: 0,
      message: '取消收藏成功'
    });
  } catch (error) {
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
