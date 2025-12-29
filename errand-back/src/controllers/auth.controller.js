const jwt = require('jsonwebtoken');
const User = require('../models/User');
const wechatService = require('../services/wechat.service');

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

    // 微信登录 - 使用标准流程
    if (code) {
      return await exports.wechatLogin(req, res);
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

// 微信小程序登录
exports.wechatLogin = async (req, res) => {
  try {
    const { code, nickname, avatar } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少微信登录凭证'
      });
    }

    // 调用微信接口获取 openid 和 session_key
    const wechatData = await wechatService.code2Session(code);
    const { openid, session_key, unionid } = wechatData;

    // 查找用户（优先使用 unionid，其次使用 openid）
    let user = null;
    if (unionid) {
      user = await User.findByUnionid(unionid);
    }
    if (!user) {
      user = await User.findByOpenid(openid);
    }

    // 如果用户不存在，创建新用户
    if (!user) {
      user = await User.createWechatUser({
        openid,
        unionid,
        session_key,
        nickname: nickname || '微信用户',
        avatar: avatar || ''
      });
    } else {
      // 更新 session_key，只在明确传递了新值时才更新昵称和头像
      const updateData = { session_key };
      
      // 只有前端明确传递了昵称和头像时才更新（避免覆盖用户已修改的信息）
      if (nickname) {
        updateData.nickname = nickname;
      }
      if (avatar) {
        updateData.avatar = avatar;
      }
      
      user = await User.updateWechatInfo(user.id, updateData);
    }

    // 生成 token
    const token = generateToken(user.id);

    res.json({
      success: true,
      code: 0,
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        openid: user.openid
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || '微信登录失败'
    });
  }
};

// 绑定/更新手机号
exports.bindPhone = async (req, res) => {
  try {
    const { encryptedData, iv } = req.body;
    const userId = req.user.id;

    if (!encryptedData || !iv) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 获取用户的 session_key
    const user = await User.findById(userId);
    if (!user || !user.session_key) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '用户信息异常，请重新登录'
      });
    }

    // 解密手机号
    const phoneData = wechatService.decryptPhoneNumber(
      encryptedData,
      iv,
      user.session_key
    );

    // 更新用户手机号
    await User.updateWechatInfo(userId, {
      phone: phoneData.purePhoneNumber
    });

    res.json({
      success: true,
      code: 0,
      data: {
        phone: phoneData.purePhoneNumber
      },
      message: '手机号绑定成功'
    });
  } catch (error) {
    console.error('绑定手机号失败:', error);
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || '绑定手机号失败'
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
