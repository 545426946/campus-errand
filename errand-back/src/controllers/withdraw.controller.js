const WithdrawRequest = require('../models/WithdrawRequest');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const paymentService = require('../services/payment.service');

/**
 * 创建提现申请
 */
exports.createWithdrawRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, account, accountType = 'wechat', realName } = req.body;

    // 验证金额
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '提现金额必须大于0'
      });
    }

    // 最小提现金额限制
    if (amount < 1) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '最小提现金额为1元'
      });
    }

    // 检查用户余额
    const user = await User.findById(userId);
    const currentBalance = parseFloat(user.balance) || 0;

    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '余额不足'
      });
    }

    // 检查是否有待处理的提现申请
    const pendingRequests = await WithdrawRequest.findByUserId(userId, {
      status: 'pending',
      pageSize: 1
    });

    if (pendingRequests.list.length > 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '您有待处理的提现申请，请等待审核完成'
      });
    }

    // 创建提现申请
    const withdrawRequest = await WithdrawRequest.create({
      user_id: userId,
      amount,
      account: account || '微信',
      account_type: accountType,
      real_name: realName || user.real_name,
      status: 'pending'
    });

    // 冻结提现金额
    await WalletTransaction.updateUserBalance(
      userId,
      amount,
      'freeze',
      {
        title: '提现冻结',
        description: `提现申请冻结 ¥${amount}`,
        status: 'completed'
      }
    );

    res.json({
      success: true,
      code: 0,
      data: {
        requestId: withdrawRequest.id,
        amount: parseFloat(amount),
        account: account || '微信',
        status: 'pending'
      },
      message: '提现申请已提交，预计1-3个工作日到账'
    });
  } catch (error) {
    console.error('创建提现申请失败:', error);
    next(error);
  }
};

/**
 * 获取我的提现申请列表
 */
exports.getMyWithdrawRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, status } = req.query;

    const result = await WithdrawRequest.findByUserId(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status
    });

    res.json({
      success: true,
      code: 0,
      data: result,
      message: '获取提现申请列表成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取提现申请详情
 */
exports.getWithdrawRequestDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const withdrawRequest = await WithdrawRequest.findById(id);

    if (!withdrawRequest) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '提现申请不存在'
      });
    }

    // 只能查看自己的提现申请
    if (withdrawRequest.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限查看此提现申请'
      });
    }

    res.json({
      success: true,
      code: 0,
      data: withdrawRequest,
      message: '获取提现申请详情成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消提现申请
 */
exports.cancelWithdrawRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const withdrawRequest = await WithdrawRequest.findById(id);

    if (!withdrawRequest) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '提现申请不存在'
      });
    }

    // 只能取消自己的提现申请
    if (withdrawRequest.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限取消此提现申请'
      });
    }

    // 只有待审核状态可以取消
    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '当前状态不允许取消'
      });
    }

    // 更新状态
    await WithdrawRequest.updateStatus(id, 'cancelled');

    // 解冻金额
    await WalletTransaction.updateUserBalance(
      userId,
      withdrawRequest.amount,
      'unfreeze',
      {
        title: '提现取消',
        description: `取消提现申请，解冻 ¥${withdrawRequest.amount}`,
        status: 'completed'
      }
    );

    res.json({
      success: true,
      code: 0,
      message: '提现申请已取消'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取所有提现申请（管理员）
 */
exports.getAllWithdrawRequests = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;

    const result = await WithdrawRequest.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status
    });

    res.json({
      success: true,
      code: 0,
      data: result,
      message: '获取提现申请列表成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 审核提现申请（管理员）
 */
exports.reviewWithdrawRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { action, note } = req.body; // action: approve | reject

    const withdrawRequest = await WithdrawRequest.findById(id);

    if (!withdrawRequest) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '提现申请不存在'
      });
    }

    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '该申请已被处理'
      });
    }

    if (action === 'approve') {
      // 批准提现
      await WithdrawRequest.approve(id, adminId, note);

      // 执行提现（从冻结余额扣除）
      const user = await User.findById(withdrawRequest.user_id);
      const frozenBalance = parseFloat(user.frozen_balance) || 0;

      if (frozenBalance < withdrawRequest.amount) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: '冻结余额不足'
        });
      }

      // 减少冻结余额
      await User.updateUserInfo(withdrawRequest.user_id, {
        frozen_balance: frozenBalance - withdrawRequest.amount
      });

      // 创建提现交易记录
      await WalletTransaction.create({
        user_id: withdrawRequest.user_id,
        type: 'withdraw',
        amount: withdrawRequest.amount,
        balance_before: parseFloat(user.balance),
        balance_after: parseFloat(user.balance),
        title: '账户提现',
        description: `提现到${withdrawRequest.account} ¥${withdrawRequest.amount}`,
        status: 'completed'
      });

      // 标记为已完成
      await WithdrawRequest.updateStatus(id, 'completed');

      res.json({
        success: true,
        code: 0,
        message: '提现申请已批准'
      });

    } else if (action === 'reject') {
      // 拒绝提现
      await WithdrawRequest.reject(id, adminId, note || '审核未通过');

      // 解冻金额
      await WalletTransaction.updateUserBalance(
        withdrawRequest.user_id,
        withdrawRequest.amount,
        'unfreeze',
        {
          title: '提现拒绝',
          description: `提现申请被拒绝，解冻 ¥${withdrawRequest.amount}`,
          status: 'completed'
        }
      );

      res.json({
        success: true,
        code: 0,
        message: '提现申请已拒绝'
      });

    } else {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '无效的操作'
      });
    }
  } catch (error) {
    console.error('审核提现申请失败:', error);
    next(error);
  }
};

/**
 * 获取提现统计
 */
exports.getWithdrawStats = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const stats = await WithdrawRequest.getStats(userId);

    res.json({
      success: true,
      code: 0,
      data: stats,
      message: '获取提现统计成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
