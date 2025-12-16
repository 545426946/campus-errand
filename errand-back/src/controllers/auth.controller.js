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
          avatar: ''
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
