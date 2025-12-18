// 测试用户注册和登录功能
const axios = require('axios');

const BASE_URL = 'http://192.168.1.133:3000/api';

// 生成随机用户名
const randomUsername = `testuser_${Date.now()}`;
const testPassword = '123456';

console.log('='.repeat(60));
console.log('用户注册登录功能测试');
console.log('='.repeat(60));

// 测试注册
async function testRegister() {
  console.log('\n【测试1】用户注册');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: randomUsername,
      password: testPassword,
      confirmPassword: testPassword
    });
    
    console.log('✅ 注册成功');
    console.log('用户名:', response.data.user.username);
    console.log('用户ID:', response.data.user.id);
    console.log('角色:', response.data.user.role);
    console.log('Token:', response.data.token.substring(0, 30) + '...');
    
    return {
      success: true,
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.log('❌ 注册失败');
    console.log('错误:', error.response?.data?.message || error.message);
    return { success: false };
  }
}

// 测试登录
async function testLogin(username, password) {
  console.log('\n【测试2】用户登录');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password
    });
    
    console.log('✅ 登录成功');
    console.log('用户名:', response.data.user.username);
    console.log('用户ID:', response.data.user.id);
    console.log('角色:', response.data.user.role);
    console.log('Token:', response.data.token.substring(0, 30) + '...');
    
    return {
      success: true,
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.log('❌ 登录失败');
    console.log('错误:', error.response?.data?.message || error.message);
    return { success: false };
  }
}

// 测试获取用户信息（需要认证）
async function testGetMe(token) {
  console.log('\n【测试3】获取用户信息（需要认证）');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取用户信息成功');
    console.log('用户名:', response.data.data.username);
    console.log('用户ID:', response.data.data.id);
    console.log('邮箱:', response.data.data.email || '未设置');
    console.log('角色:', response.data.data.role);
    
    return { success: true };
  } catch (error) {
    console.log('❌ 获取用户信息失败');
    console.log('错误:', error.response?.data?.message || error.message);
    return { success: false };
  }
}

// 测试重复注册（应该失败）
async function testDuplicateRegister(username) {
  console.log('\n【测试4】重复注册（应该失败）');
  console.log('-'.repeat(60));
  
  try {
    await axios.post(`${BASE_URL}/auth/register`, {
      username,
      password: testPassword,
      confirmPassword: testPassword
    });
    
    console.log('❌ 测试失败：重复注册应该被拒绝');
    return { success: false };
  } catch (error) {
    if (error.response?.data?.message === '用户名已存在') {
      console.log('✅ 测试通过：正确拒绝了重复注册');
      console.log('错误信息:', error.response.data.message);
      return { success: true };
    } else {
      console.log('❌ 测试失败：错误信息不正确');
      console.log('错误:', error.response?.data?.message || error.message);
      return { success: false };
    }
  }
}

// 测试错误密码登录（应该失败）
async function testWrongPassword(username) {
  console.log('\n【测试5】错误密码登录（应该失败）');
  console.log('-'.repeat(60));
  
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password: 'wrongpassword'
    });
    
    console.log('❌ 测试失败：错误密码应该被拒绝');
    return { success: false };
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 测试通过：正确拒绝了错误密码');
      console.log('错误信息:', error.response.data.message);
      return { success: true };
    } else {
      console.log('❌ 测试失败：错误状态码不正确');
      console.log('错误:', error.response?.data?.message || error.message);
      return { success: false };
    }
  }
}

// 测试无效 Token（应该失败）
async function testInvalidToken() {
  console.log('\n【测试6】无效 Token 访问（应该失败）');
  console.log('-'.repeat(60));
  
  try {
    await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });
    
    console.log('❌ 测试失败：无效 Token 应该被拒绝');
    return { success: false };
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 测试通过：正确拒绝了无效 Token');
      console.log('错误信息:', error.response.data.message);
      return { success: true };
    } else {
      console.log('❌ 测试失败：错误状态码不正确');
      console.log('错误:', error.response?.data?.message || error.message);
      return { success: false };
    }
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('\n开始测试...\n');
  
  const results = {
    total: 6,
    passed: 0,
    failed: 0
  };
  
  // 测试1: 注册
  const registerResult = await testRegister();
  if (registerResult.success) {
    results.passed++;
  } else {
    results.failed++;
    console.log('\n⚠️  注册失败，后续测试可能无法进行');
    return;
  }
  
  // 测试2: 登录
  const loginResult = await testLogin(randomUsername, testPassword);
  if (loginResult.success) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 测试3: 获取用户信息
  if (loginResult.success) {
    const getMeResult = await testGetMe(loginResult.token);
    if (getMeResult.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    console.log('\n⚠️  跳过测试3：登录失败');
    results.failed++;
  }
  
  // 测试4: 重复注册
  const duplicateResult = await testDuplicateRegister(randomUsername);
  if (duplicateResult.success) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 测试5: 错误密码
  const wrongPasswordResult = await testWrongPassword(randomUsername);
  if (wrongPasswordResult.success) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 测试6: 无效 Token
  const invalidTokenResult = await testInvalidToken();
  if (invalidTokenResult.success) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 输出测试结果
  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  console.log(`总测试数: ${results.total}`);
  console.log(`通过: ${results.passed} ✅`);
  console.log(`失败: ${results.failed} ❌`);
  console.log(`成功率: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过！用户注册登录功能正常！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查后端服务和数据库连接');
  }
}

// 执行测试
runAllTests().catch(error => {
  console.error('\n❌ 测试执行出错:', error.message);
  console.log('\n请确保：');
  console.log('1. 后端服务已启动 (npm start)');
  console.log('2. 数据库连接正常');
  console.log('3. 数据库表已创建');
});
