const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const user = await User.create({
      username,
      email,
      password,
      role
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      code: 0,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: '注册成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, code } = req.body;

    // 微信登录
    if (code) {
      // 简化版：直接创建或查找用户（实际应该调用微信API验证code）
      let user = await User.findByWechatCode(code);
      
      if (!user) {
        // 创建新用户
        user = await User.createWechatUser({
          openid: `wx_${code}_${Date.now()}`,
          nickname: '微信用户',
          avatar: '',
          username: `wx_user_${Date.now()}`
        });
      }

      const token = generateToken(user.id);

      return res.json({
        success: true,
        code: 0,
        data: {
          token,
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone
          }
        },
        message: '登录成功'
      });
    }

    // 邮箱密码登录
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供邮箱和密码'
      });
    }

    const user = await User.findByEmail(email);

    if (!user || !(await User.comparePassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '邮箱或密码错误'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      code: 0,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: '登录成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      code: 0,
      data: user,
      message: '获取用户信息成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message
    });
  }
};

// 发送验证码
exports.sendCode = async (req, res) => {
  try {
    const { phone, email, type } = req.body;

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供手机号或邮箱'
      });
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 简化版：直接返回成功（实际应该发送短信或邮件）
    // 在实际项目中，应该：
    // 1. 将验证码存储到Redis，设置5分钟过期
    // 2. 调用短信或邮件服务发送验证码
    
    console.log(`验证码: ${code} (${type}) 发送到 ${phone || email}`);

    res.json({
      success: true,
      code: 0,
      data: { 
        code: process.env.NODE_ENV === 'development' ? code : undefined // 开发环境返回验证码
      },
      message: '验证码已发送'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message
    });
  }
};

// 验证验证码
exports.verifyCode = async (req, res) => {
  try {
    const { phone, email, code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供验证码'
      });
    }

    // 简化版：验证码为123456时通过
    // 实际项目中应该从Redis中获取并验证
    const isValid = code === '123456';

    if (!isValid) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '验证码错误或已过期'
      });
    }

    res.json({
      success: true,
      code: 0,
      message: '验证成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message
    });
  }
};

// 退出登录
exports.logout = async (req, res) => {
  try {
    // 简化版：直接返回成功
    // 实际项目中应该：
    // 1. 将token加入黑名单（Redis）
    // 2. 清除相关缓存
    
    res.json({
      success: true,
      code: 0,
      message: '退出登录成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message
    });
  }
};
