const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    const { username, password, confirmPassword, email, role } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    // 验证密码确认
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '两次输入的密码不一致'
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '用户名已存在'
      });
    }

    console.log('创建用户:', { username, email: email || null, role: role || 'student' });
    
    const user = await User.create({
      username,
      email: email || null, // email可选
      password,
      role: role || 'student'
    });

    console.log('用户创建成功:', user);

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
    const { username, email, password, code } = req.body;

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

    // 账号密码登录（支持用户名或邮箱）
    if (!password) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供密码'
      });
    }

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供用户名或邮箱'
      });
    }

    // 优先使用用户名登录，其次使用邮箱
    let user;
    if (username) {
      user = await User.findByUsername(username);
      console.log('通过用户名查找用户:', username, '结果:', user ? '找到' : '未找到');
    } else if (email) {
      user = await User.findByEmail(email);
      console.log('通过邮箱查找用户:', email, '结果:', user ? '找到' : '未找到');
    }

    if (!user) {
      console.log('用户不存在');
      return res.status(401).json({
        success: false,
        code: 401,
        message: '用户名/邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await User.comparePassword(password, user.password);
    console.log('密码验证结果:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('密码错误');
      return res.status(401).json({
        success: false,
        code: 401,
        message: '用户名/邮箱或密码错误'
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
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar
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
