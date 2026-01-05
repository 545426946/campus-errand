const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// 验证管理员token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 检查是否是管理员token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权访问管理员功能'
      });
    }

    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '管理员不存在'
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '管理员账号已被禁用'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    }
    res.status(500).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
};

// 验证超级管理员权限
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '需要超级管理员权限'
    });
  }
  next();
};

// 验证管理员或超级管理员权限
const requireAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
};

module.exports = {
  verifyAdminToken,
  requireSuperAdmin,
  requireAdmin
};
