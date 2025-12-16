const User = require('../models/User');

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
    // 简化版：返回固定余额
    res.json({
      success: true,
      code: 0,
      data: {
        balance: 0,
        frozen: 0,
        total: 0
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

module.exports = exports;
