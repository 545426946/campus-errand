const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        code: 401,
        message: '未授权访问，请先登录' 
      });
    }

    // 验证 token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT验证失败:', jwtError.message);
      return res.status(401).json({ 
        success: false,
        code: 401,
        message: 'Token无效或已过期',
        tokenExpired: true // 标记 token 已过期
      });
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        code: 401,
        message: '用户不存在' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(401).json({ 
      success: false,
      code: 401,
      message: 'Token无效或已过期',
      tokenExpired: true
    });
  }
};

// 别名，为了兼容性
exports.authenticate = exports.protect;

// 可选认证中间件 - 如果有token就验证，没有token也继续
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 如果没有token，直接继续，不报错
    if (!token) {
      req.user = null;
      return next();
    }

    // 验证 token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      console.error('JWT验证失败（可选认证）:', jwtError.message);
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('可选认证错误:', error);
    req.user = null;
    next();
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }
    next();
  };
};
