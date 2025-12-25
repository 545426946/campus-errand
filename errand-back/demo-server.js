const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 模拟token和用户映射
const tokenUserMap = new Map();

// 生成token的函数
const generateToken = (user) => {
  const token = 'user_token_' + Date.now() + '_' + user.id;
  tokenUserMap.set(token, {
    id: user.id,
    username: user.username
  });
  return token;
};

// 模拟token验证中间件
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = authHeader ? authHeader.replace('Bearer ', '') : req.query.token;
  
  console.log('=== 认证中间件开始 ===');
  console.log('请求URL:', req.url);
  console.log('请求方法:', req.method);
  console.log('Authorization头:', authHeader ? '存在' : '不存在');
  console.log('Token:', token ? token.substring(0, 30) + '...' : '无token');
  
  // 如果没有token，尝试使用默认测试token
  if (!token) {
    token = 'test_token_1'; // 默认测试用户
    console.log('使用默认测试token');
  }
  
  // 从token映射中获取用户信息
  let user = tokenUserMap.get(token);
  
  // 特殊处理：如果token包含用户ID信息（比如从登录返回的token）
  if (!user && token.includes('user_token_')) {
    try {
      const parts = token.split('_');
      if (parts.length >= 3) {
        const userId = parseInt(parts[2]) || 1;
        console.log('从token解析用户ID:', userId);
        
        // 优先从mockUsers中查找
        user = mockUsers.find(u => u.id === userId);
        
        if (!user) {
          // 如果没找到，创建新用户（支持1234567这样的账户）
          user = createOrUpdateUser(userId, `user${userId}`);
          console.log('为新用户ID创建账户:', user);
        } else {
          console.log('找到现有用户:', user);
        }
        
        // 更新token映射
        tokenUserMap.set(token, user);
      }
    } catch (error) {
      console.error('解析token失败:', error);
    }
  }
  
  // 如果token不存在，但以demo_token_开头，创建新用户
  if (!user && token.startsWith('demo_token_')) {
    const userId = parseInt(token.split('_')[2]) || 1;
    user = {
      id: userId,
      username: `user${userId}`
    };
    tokenUserMap.set(token, user);
    console.log(`为新token创建用户:`, user);
  }
  
  // 处理常见的测试token
  if (!user) {
    if (token === 'test_token_1') {
      user = { id: 1, username: 'test' };
    } else if (token === 'test_token_2') {
      user = { id: 2, username: 'user2' };
    } else if (token.startsWith('demo_token_')) {
      // 创建随机用户用于测试
      const randomId = Math.floor(Math.random() * 1000) + 2;
      user = { id: randomId, username: `demo_user_${randomId}` };
    } else {
      // 为任何新token创建用户（支持各种ID）
      const newUserId = Math.max(...mockUsers.map(u => u.id)) + 1;
      user = { id: newUserId, username: `new_user_${newUserId}` };
    }
    
    tokenUserMap.set(token, user);
    console.log(`创建新用户映射: token=${token}, user=`, user);
  }
  
  req.user = user;
  req.token = token;
  
  console.log(`认证完成: token=${token.substring(0, 20)}..., user=`, user);
  console.log('=== 认证中间件结束 ===\n');
  next();
};

// 模拟用户数据
let mockUsers = [
  {
    id: 1,
    username: 'test',
    password: '123456', // 实际应用中需要加密
    nickname: '测试用户',
    avatar: '/images/default-avatar.png',
    phone: '13800138000',
    balance: 100.00,
    frozen: 0.00,
    total: 100.00,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    username: 'user2',
    password: '123456',
    nickname: '用户2',
    avatar: '/images/default-avatar.png',
    phone: '13800138001',
    balance: 50.00,
    frozen: 0.00,
    total: 50.00,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    username: 'demo',
    password: '123456',
    nickname: '演示用户',
    avatar: '/images/default-avatar.png',
    phone: '13800138002',
    balance: 200.00,
    frozen: 0.00,
    total: 200.00,
    created_at: new Date().toISOString()
  }
];

// 动态创建新用户的函数
const createOrUpdateUser = (userId, username) => {
  let user = mockUsers.find(u => u.id === userId);
  if (!user) {
    // 生成手机号（支持大ID）
    let phone;
    if (userId >= 10000) {
      // 对于大ID（如1234567），使用不同的手机号生成策略
      phone = `1${Math.floor(Math.random() * 9) + 1}${String(userId).slice(-9)}`;
    } else {
      // 对于小ID，使用原有策略
      phone = `1380013${String(userId).padStart(4, '0')}`;
    }
    
    // 创建新用户
    user = {
      id: userId,
      username: username || `user${userId}`,
      password: '123456',
      nickname: username || `用户${userId}`,
      avatar: '/images/default-avatar.png',
      phone: phone,
      balance: 30.00, // 新用户初始余额
      frozen: 0.00,
      total: 30.00,
      created_at: new Date().toISOString()
    };
    mockUsers.push(user);
    console.log(`创建新用户:`, {
      id: user.id,
      username: user.username,
      phone: user.phone,
      balance: user.balance
    });
  } else {
    console.log(`找到现有用户:`, {
      id: user.id,
      username: user.username,
      phone: user.phone,
      balance: user.balance
    });
  }
  return user;
};

// 钱包交易记录
let walletTransactions = [
  {
    id: 1,
    user_id: 1,
    type: 'recharge',
    amount: 100.00,
    balance_before: 0,
    balance_after: 100.00,
    description: '微信充值',
    order_id: 'R1234567890',
    status: 'success',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

let transactionIdCounter = 2;

let mockOrders = [
  {
    id: 1,
    title: '帮忙取快递',
    description: '菜鸟驿站有一个中通快递，帮忙取一下送到宿舍楼下',
    service_type: 1,
    fee: 5.00,
    location: '菜鸟驿站',
    destination: '宿舍楼下',
    status: 'pending',
    publisher_id: 1,
    publisher_nickname: '测试用户',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: '代买午饭',
    description: '帮忙去食堂买一份黄焖鸡米饭，微辣',
    service_type: 2,
    fee: 8.00,
    location: '食堂',
    destination: '教学楼A205',
    status: 'accepted',
    publisher_id: 1,
    accepter_id: 1,
    publisher_nickname: '测试用户',
    accepter_nickname: '测试用户',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: '帮忙取外卖',
    description: '点了一份奶茶外卖，帮忙取一下送到图书馆',
    service_type: 1,
    fee: 6.00,
    location: '校门口外卖架',
    destination: '图书馆门口',
    status: 'pending',
    publisher_id: 15,
    publisher_nickname: 'user15',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 4,
    title: '代购生活用品',
    description: '帮忙去超市买一瓶洗发水和一管牙膏',
    service_type: 3,
    fee: 10.00,
    location: '校园超市',
    destination: '宿舍楼下',
    status: 'completed',
    publisher_id: 15,
    accepter_id: 2,
    publisher_nickname: 'user15',
    accepter_nickname: 'user2',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 5,
    title: '送文件到办公室',
    description: '有一份文件需要从宿舍送到老师办公室',
    service_type: 4,
    fee: 8.00,
    location: '学生宿舍',
    destination: '行政楼201',
    status: 'accepted',
    publisher_id: 15,
    accepter_id: 3,
    publisher_nickname: 'user15',
    accepter_nickname: 'user3',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    accepted_at: new Date(Date.now() - 900000).toISOString()
  }
];

let orderIdCounter = mockOrders.length + 1;

// 服务类型映射
const serviceTypeMap = {
  1: '快递代取',
  2: '外卖配送',
  3: '代购服务',
  4: '其他服务'
};

// 状态映射
const statusMap = {
  pending: '待接单',
  accepted: '进行中',
  completed: '已完成',
  cancelled: '已取消'
};

// API路由
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    message: '服务器运行正常 (演示模式)',
    timestamp: new Date().toISOString(),
    mode: 'demo'
  });
});

// 用户认证
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('=== 登录请求 ===');
    console.log('用户名:', username);
    console.log('密码:', password ? '***' : '空');
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    let user = null;
    let userId = null;
    
    // 支持用户名是数字ID的情况（比如1234567）
    if (/^\d+$/.test(username)) {
      userId = parseInt(username);
      console.log('检测到数字用户名:', userId);
      user = mockUsers.find(u => u.id === userId);
    } else {
      // 按用户名查找
      user = mockUsers.find(u => u.username === username);
    }
    
    if (!user) {
      // 如果用户不存在，创建新用户（演示模式）
      if (userId) {
        // 使用输入的数字ID创建用户
        user = createOrUpdateUser(userId, `user${userId}`);
        console.log('使用输入ID创建新用户:', user);
      } else {
        // 使用自增ID创建用户
        const newUserId = Math.max(...mockUsers.map(u => u.id)) + 1;
        user = createOrUpdateUser(newUserId, username);
        console.log('自动创建新用户:', user);
      }
    }
    
    // 验证密码（演示模式都使用123456）
    if (password === '123456' || password === user.password) {
      // 生成并存储token，确保包含用户ID
      const token = `user_token_${Date.now()}_${user.id}`;
      tokenUserMap.set(token, {
        id: user.id,
        username: user.username
      });
      
      // 返回用户信息（不包含密码）
      const { password: pwd, ...userInfo } = user;
      
      console.log('登录成功:', {
        username: userInfo.username,
        userId: userInfo.id,
        balance: userInfo.balance,
        token: token.substring(0, 30) + '...'
      });
      
      res.json({
        success: true,
        data: {
          token: token,
          user: userInfo
        }
      });
    } else {
      console.log('登录失败: 密码错误');
      res.status(401).json({
        success: false,
        message: '用户名或密码错误（提示：使用123456）'
      });
    }
  } catch (error) {
    console.error('登录异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, nickname, phone } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    const existingUser = mockUsers.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    const newUser = {
      id: mockUsers.length + 1,
      username,
      password,
      nickname: nickname || username,
      phone: phone || '',
      avatar: '/images/default-avatar.png',
      balance: 0,
      created_at: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    const { password: pwd, ...userInfo } = newUser;
    
    res.status(201).json({
      success: true,
      data: {
        token: 'demo_token_' + Date.now(),
        user: userInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
});

// 获取用户信息
app.get('/api/user/profile', authMiddleware, (req, res) => {
  try {
    const user = mockUsers[0]; // 演示模式返回第一个用户
    const { password, ...userInfo } = user;
    
    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 更新用户信息
app.put('/api/user/profile', authMiddleware, (req, res) => {
  try {
    console.log('=== 更新用户信息 ===');
    console.log('请求用户:', req.user);
    console.log('更新数据:', req.body);
    
    // 确保用户存在，如果不存在则创建
    const user = createOrUpdateUser(req.user.id, req.user.username);
    
    // 更新用户信息
    Object.assign(user, req.body);
    
    console.log('更新后用户信息:', user);
    
    res.json({
      success: true,
      data: user,
      message: '更新用户信息成功'
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

// 获取钱包信息
app.get('/api/user/wallet', authMiddleware, (req, res) => {
  try {
    console.log('=== 获取钱包信息 ===');
    console.log('请求用户:', req.user);
    console.log('请求token:', req.token);
    
    // 直接从mockUsers数组中查找用户，如果不存在则创建
    let user = mockUsers.find(u => u.id === req.user.id);
    
    if (!user) {
      // 用户不存在，创建新用户
      user = createOrUpdateUser(req.user.id, req.user.username);
      // 再次尝试获取，确保用户在数组中
      user = mockUsers.find(u => u.id === req.user.id);
    }
    
    console.log('获取钱包信息 - 找到用户:', {
      userId: user.id,
      username: user.username,
      balance: user.balance,
      frozen: user.frozen
    });
    
    // 计算总余额（包括冻结金额）
    const totalBalance = (user.balance || 0) + (user.frozen || 0);
    
    console.log('用户钱包信息:', {
      userId: user.id,
      username: user.username,
      balance: user.balance,
      frozen: user.frozen,
      total: totalBalance
    });
    
    res.json({
      success: true,
      data: {
        balance: parseFloat(user.balance || 0),
        frozen: parseFloat(user.frozen || 0),
        total: parseFloat(totalBalance)
      }
    });
  } catch (error) {
    console.error('获取钱包信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取钱包信息失败: ' + error.message
    });
  }
});

// 获取钱包明细
app.get('/api/user/wallet/details', authMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 20, type } = req.query;
    
    console.log('=== 获取钱包明细 ===');
    console.log('请求用户:', req.user);
    console.log('请求用户ID:', req.user.id, typeof req.user.id);
    console.log('请求参数:', { page, pageSize, type });
    
    // 打印所有交易记录用于调试
    console.log('当前所有交易记录:');
    walletTransactions.forEach((t, index) => {
      console.log(`  [${index}] user_id: ${t.user_id} (${typeof t.user_id}), amount: ${t.amount}, type: ${t.type}, desc: ${t.description}`);
    });
    
    // 确保用户存在
    const user = createOrUpdateUser(req.user.id, req.user.username);
    console.log('确认用户存在:', user);
    
    // 获取当前用户的交易记录 - 确保类型匹配
    let userTransactions = walletTransactions.filter(t => {
      const userIdMatch = t.user_id === req.user.id || t.user_id === parseInt(req.user.id);
      console.log(`交易记录 ${t.id}: user_id=${t.user_id} vs req.user.id=${req.user.id}, 匹配=${userIdMatch}`);
      return userIdMatch;
    });
    
    console.log(`用户${req.user.username}(ID:${req.user.id})的交易记录数:`, userTransactions.length);
    
    // 按类型过滤
    if (type) {
      userTransactions = userTransactions.filter(transaction => transaction.type === type);
    }
    
    // 按时间倒序排列（最新的在前）
    userTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // 分页
    const startIndex = (page - 1) * parseInt(pageSize);
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedTransactions = userTransactions.slice(startIndex, endIndex);
    
    // 格式化交易数据
    const formattedTransactions = paginatedTransactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      balance_before: transaction.balance_before,
      balance_after: transaction.balance_after,
      description: transaction.description,
      order_id: transaction.order_id,
      status: transaction.status,
      created_at: transaction.created_at
    }));

    console.log(`返回用户${req.user.username}的交易记录:`, formattedTransactions.length, '条');

    res.json({
      success: true,
      data: {
        list: formattedTransactions,
        total: userTransactions.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取钱包明细失败:', error);
    res.status(500).json({
      success: false,
      message: '获取钱包明细失败: ' + error.message
    });
  }
});

// 钱包充值
app.post('/api/user/wallet/recharge', authMiddleware, (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    console.log('=== 充值请求开始 ===');
    console.log('请求用户:', req.user);
    console.log('请求token:', req.token);
    console.log('请求体:', req.body);
    console.log('充值金额:', amount, typeof amount);
    console.log('支付方式:', paymentMethod);
    
    // 验证充值金额
    if (!amount || amount <= 0) {
      console.log('❌ 充值金额无效');
      return res.status(400).json({
        success: false,
        message: '充值金额必须大于0'
      });
    }

    // 首先检查用户是否已在数组中存在
    let userIndex = mockUsers.findIndex(u => u.id === req.user.id);
    let user;
    let oldBalance;
    
    if (userIndex !== -1) {
      // 用户已存在，使用现有用户数据
      user = mockUsers[userIndex];
      oldBalance = parseFloat(user.balance || 0);
      console.log('找到现有用户:', {
        id: user.id,
        username: user.username,
        currentBalance: oldBalance
      });
    } else {
      // 用户不存在，创建新用户
      user = createOrUpdateUser(req.user.id, req.user.username);
      oldBalance = parseFloat(user.balance || 0);
      userIndex = mockUsers.findIndex(u => u.id === req.user.id);
      console.log('创建新用户:', {
        id: user.id,
        username: user.username,
        initialBalance: oldBalance
      });
    }
    
    const rechargeAmount = parseFloat(amount);
    const newBalance = oldBalance + rechargeAmount;
    
    console.log('用户充值余额变化:', {
      userId: user.id,
      username: user.username,
      oldBalance,
      rechargeAmount,
      newBalance
    });
    
    // 创建交易记录
    const transaction = {
      id: transactionIdCounter++,
      user_id: req.user.id,
      type: 'recharge',
      amount: rechargeAmount,
      balance_before: oldBalance,
      balance_after: newBalance,
      description: `${paymentMethod === 'wechat' ? '微信' : '支付宝'}充值`,
      order_id: 'R' + Date.now(),
      status: 'success',
      created_at: new Date().toISOString()
    };
    
    console.log('创建交易记录:', {
      transactionId: transaction.id,
      user_id: transaction.user_id,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status
    });
    
    // 添加交易记录到数组开头
    walletTransactions.unshift(transaction);
    console.log(`添加后总交易记录数: ${walletTransactions.length}`);
    
    // 关键修复：直接更新数组中用户的余额和总额
    if (userIndex !== -1) {
      mockUsers[userIndex].balance = newBalance;
      mockUsers[userIndex].total = parseFloat(mockUsers[userIndex].total || 0) + rechargeAmount;
      
      console.log('✅ 用户余额已更新到数组:', {
        userId: mockUsers[userIndex].id,
        username: mockUsers[userIndex].username,
        newBalance: mockUsers[userIndex].balance,
        newTotal: mockUsers[userIndex].total
      });
      
      // 验证更新结果
      const updatedUser = mockUsers[userIndex];
      console.log('更新验证 - 用户当前余额:', updatedUser.balance);
    }
    
    console.log('✅ 充值处理完成:', {
      userId: user.id,
      username: user.username,
      transaction: transaction,
      userNewBalance: user.balance,
      userTotal: user.total
    });
    
    // 返回成功响应
    const responseData = {
      success: true,
      data: {
        transaction_id: transaction.id,
        order_id: transaction.order_id,
        amount: rechargeAmount,
        balance_before: oldBalance,
        balance_after: newBalance,
        paymentMethod: paymentMethod || 'wechat',
        status: 'success',
        message: '充值成功'
      }
    };
    
    console.log('返回充值响应:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ 充值处理异常:', error);
    res.status(500).json({
      success: false,
      message: '充值失败: ' + error.message
    });
  }
});

// 钱包提现
app.post('/api/user/wallet/withdraw', authMiddleware, (req, res) => {
  try {
    const { amount, account } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '提现金额必须大于0'
      });
    }

    const user = mockUsers[0];
    const currentBalance = user.balance || 0;
    
    if (parseFloat(amount) > currentBalance) {
      return res.status(400).json({
        success: false,
        message: '余额不足'
      });
    }

    const newBalance = currentBalance - parseFloat(amount);
    
    // 更新用户余额
    user.balance = newBalance;
    user.frozen = (user.frozen || 0) + parseFloat(amount);

    res.json({
      success: true,
      data: {
        orderId: 'W' + Date.now(),
        amount: parseFloat(amount),
        balance: newBalance,
        frozen: user.frozen,
        account: account || '微信',
        status: 'pending',
        message: '提现申请已提交，预计1-3个工作日到账'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提现失败'
    });
  }
});

// 订单相关
app.get('/api/orders', (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filteredOrders = [...mockOrders];
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // 添加服务类型和状态文字
    const ordersWithText = filteredOrders.map(order => ({
      ...order,
      service_type_text: serviceTypeMap[order.service_type] || '其他服务',
      status_text: statusMap[order.status] || '未知状态'
    }));
    
    res.json({
      success: true,
      data: {
        orders: ordersWithText,
        total: ordersWithText.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = mockOrders.find(o => o.id === parseInt(req.params.id));
    
    if (order) {
      const orderWithText = {
        ...order,
        service_type_text: serviceTypeMap[order.service_type] || '其他服务',
        status_text: statusMap[order.status] || '未知状态'
      };
      
      res.json({
        success: true,
        data: orderWithText
      });
    } else {
      res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { title, description, service_type, fee, location, destination } = req.body;
    
    if (!title || !description || !service_type || !fee || !location || !destination) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的订单信息'
      });
    }
    
    const newOrder = {
      id: orderIdCounter++,
      title,
      description,
      service_type: parseInt(service_type),
      fee: parseFloat(fee),
      location,
      destination,
      status: 'pending',
      publisher_id: 1,
      publisher_nickname: '测试用户',
      created_at: new Date().toISOString()
    };
    
    mockOrders.unshift(newOrder);
    
    const orderWithText = {
      ...newOrder,
      service_type_text: serviceTypeMap[newOrder.service_type] || '其他服务',
      status_text: statusMap[newOrder.status] || '未知状态'
    };
    
    res.status(201).json({
      success: true,
      data: orderWithText
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
});

// 接单
app.put('/api/orders/:id/accept', (req, res) => {
  try {
    const order = mockOrders.find(o => o.id === parseInt(req.params.id));
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '订单状态不正确'
      });
    }
    
    order.status = 'accepted';
    order.accepter_id = 1;
    order.accepter_nickname = '测试用户';
    order.accepted_at = new Date().toISOString();
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '接单失败'
    });
  }
});

// 完成订单
app.put('/api/orders/:id/complete', (req, res) => {
  try {
    const order = mockOrders.find(o => o.id === parseInt(req.params.id));
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (order.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: '订单状态不正确'
      });
    }
    
    order.status = 'completed';
    order.completed_at = new Date().toISOString();
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '完成订单失败'
    });
  }
});

// 获取我发布的订单
app.get('/api/orders/my-publish', authMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const userId = req.user.id;
    
    console.log('=== 获取我发布的订单 ===');
    console.log('用户ID:', userId);
    console.log('查询参数:', { page, pageSize, status });
    
    // 过滤用户发布的订单
    let myOrders = mockOrders.filter(order => order.user_id === userId);
    
    // 按状态过滤
    if (status) {
      myOrders = myOrders.filter(order => order.status === status);
    }
    
    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedOrders = myOrders.slice(startIndex, endIndex);
    
    // 添加状态和服务类型文字
    const ordersWithText = paginatedOrders.map(order => ({
      ...order,
      service_type_text: serviceTypeMap[order.service_type] || '其他服务',
      status_text: statusMap[order.status] || '未知状态'
    }));
    
    console.log(`用户${userId}发布的订单数量:`, myOrders.length);
    console.log(`返回${ordersWithText.length}条订单`);
    
    res.json({
      success: true,
      data: ordersWithText
    });
  } catch (error) {
    console.error('获取我发布的订单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
});

// 获取我接受的订单
app.get('/api/orders/my-accepted', authMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const userId = req.user.id;
    
    console.log('=== 获取我接受的订单 ===');
    console.log('用户ID:', userId);
    console.log('查询参数:', { page, pageSize, status });
    
    // 过滤用户接受的订单
    let myOrders = mockOrders.filter(order => order.acceptor_id === userId);
    
    // 按状态过滤
    if (status) {
      myOrders = myOrders.filter(order => order.status === status);
    }
    
    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedOrders = myOrders.slice(startIndex, endIndex);
    
    // 添加状态和服务类型文字
    const ordersWithText = paginatedOrders.map(order => ({
      ...order,
      service_type_text: serviceTypeMap[order.service_type] || '其他服务',
      status_text: statusMap[order.status] || '未知状态'
    }));
    
    console.log(`用户${userId}接受的订单数量:`, myOrders.length);
    console.log(`返回${ordersWithText.length}条订单`);
    
    res.json({
      success: true,
      data: ordersWithText
    });
  } catch (error) {
    console.error('获取我接受的订单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
});

// 获取服务类型
app.get('/api/service-types', (req, res) => {
  try {
    const types = Object.entries(serviceTypeMap).map(([key, value]) => ({
      id: parseInt(key),
      name: value
    }));
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取服务类型失败'
    });
  }
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器启动成功！`);
  console.log(`📍 地址: http://192.168.1.163:${PORT}`);
  console.log(`📍 本地: http://192.168.1.161:${PORT}`);
  console.log(`🔧 模式: 演示模式 (无需数据库)`);
  console.log(`👤 测试账号: test / 123456`);
  console.log(`⏰ 时间: ${new Date().toLocaleString()}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;