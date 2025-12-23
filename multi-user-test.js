// 多用户钱包功能测试脚本
const BASE_URL = 'http://localhost:3000';

// 存储用户token
const userTokens = new Map();

async function request(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 用户登录
async function loginUser(username, password) {
  console.log(`🔐 登录用户: ${username}`);
  
  const result = await request('/api/auth/login', 'POST', {
    username,
    password
  });
  
  if (result.success && result.data.success) {
    const token = result.data.data.token;
    const user = result.data.data.user;
    
    userTokens.set(username, {
      token: token,
      user: user
    });
    
    console.log(`✅ 用户 ${username} 登录成功`);
    console.log(`   - 用户ID: ${user.id}`);
    console.log(`   - 用户名: ${user.username}`);
    console.log(`   - 初始余额: ¥${user.balance}`);
    console.log(`   - Token: ${token.substring(0, 30)}...`);
    
    return { token, user };
  } else {
    console.log(`❌ 用户 ${username} 登录失败:`, result.data.message);
    return null;
  }
}

// 获取用户钱包信息
async function getWalletInfo(username) {
  const userInfo = userTokens.get(username);
  if (!userInfo) {
    console.log(`❌ 用户 ${username} 未登录`);
    return null;
  }
  
  const result = await request('/api/user/wallet', 'GET', null, userInfo.token);
  
  if (result.success && result.data.success) {
    const wallet = result.data.data;
    console.log(`💰 用户 ${username} 钱包信息:`);
    console.log(`   - 余额: ¥${wallet.balance}`);
    console.log(`   - 冻结: ¥${wallet.frozen}`);
    console.log(`   - 总计: ¥${wallet.total}`);
    return wallet;
  } else {
    console.log(`❌ 获取用户 ${username} 钱包信息失败:`, result.data.message);
    return null;
  }
}

// 用户充值
async function rechargeUser(username, amount) {
  const userInfo = userTokens.get(username);
  if (!userInfo) {
    console.log(`❌ 用户 ${username} 未登录`);
    return false;
  }
  
  console.log(`💸 用户 ${username} 充值 ¥${amount}`);
  
  const result = await request('/api/user/wallet/recharge', 'POST', {
    amount: amount,
    paymentMethod: 'wechat'
  }, userInfo.token);
  
  if (result.success && result.data.success) {
    const rechargeData = result.data.data;
    console.log(`✅ 用户 ${username} 充值成功:`);
    console.log(`   - 充值金额: ¥${rechargeData.amount}`);
    console.log(`   - 充值前: ¥${rechargeData.balance_before}`);
    console.log(`   - 充值后: ¥${rechargeData.balance_after}`);
    return true;
  } else {
    console.log(`❌ 用户 ${username} 充值失败:`, result.data.message);
    return false;
  }
}

// 获取用户交易明细
async function getTransactionDetails(username) {
  const userInfo = userTokens.get(username);
  if (!userInfo) {
    console.log(`❌ 用户 ${username} 未登录`);
    return null;
  }
  
  const result = await request('/api/user/wallet/details', 'GET', null, userInfo.token);
  
  if (result.success && result.data.success) {
    const details = result.data.data;
    console.log(`📋 用户 ${username} 交易明细:`);
    console.log(`   - 总记录数: ${details.total}`);
    details.list.forEach((transaction, index) => {
      console.log(`   ${index + 1}. ${transaction.description} - ¥${transaction.amount} (${transaction.created_at})`);
    });
    return details;
  } else {
    console.log(`❌ 获取用户 ${username} 交易明细失败:`, result.data.message);
    return null;
  }
}

// 完整的多用户测试
async function multiUserTest() {
  console.log('🚀 开始多用户钱包功能测试...\n');
  
  // 测试用户列表
  const testUsers = [
    { username: 'test', password: '123456' },
    { username: 'alice', password: '123456' },
    { username: 'bob', password: '123456' },
    { username: 'charlie', password: '123456' }
  ];
  
  // 1. 所有用户登录
  console.log('📍 步骤1: 用户登录');
  const loggedUsers = [];
  
  for (const user of testUsers) {
    const loginResult = await loginUser(user.username, user.password);
    if (loginResult) {
      loggedUsers.push({ ...user, ...loginResult });
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟
  }
  
  console.log(`\n✅ 成功登录用户数: ${loggedUsers.length}/${testUsers.length}\n`);
  
  // 2. 检查所有用户初始余额
  console.log('📍 步骤2: 检查初始余额');
  for (const user of loggedUsers) {
    await getWalletInfo(user.username);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 3. 为每个用户充值不同金额
  console.log('\n📍 步骤3: 多用户充值测试');
  const rechargeAmounts = [100, 50, 200, 75];
  
  for (let i = 0; i < loggedUsers.length; i++) {
    const user = loggedUsers[i];
    const amount = rechargeAmounts[i];
    await rechargeUser(user.username, amount);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 4. 检查充值后余额
  console.log('\n📍 步骤4: 检查充值后余额');
  for (const user of loggedUsers) {
    await getWalletInfo(user.username);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 5. 检查交易记录
  console.log('\n📍 步骤5: 检查交易记录');
  for (const user of loggedUsers) {
    await getTransactionDetails(user.username);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 多用户钱包功能测试完成！');
  console.log('\n📱 小程序测试说明:');
  console.log('1. 可以使用以下任意账号登录:');
  loggedUsers.forEach(user => {
    console.log(`   - ${user.username} / 123456 (初始余额: ¥${user.user.balance})`);
  });
  console.log('2. 每个用户的充值和余额都是独立的');
  console.log('3. 每个用户只能看到自己的交易记录');
  console.log('4. 支持动态创建新用户');
}

// 运行测试
multiUserTest().catch(console.error);