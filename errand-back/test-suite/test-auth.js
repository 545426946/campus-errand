/**
 * 认证模块测试
 * 测试用户注册、登录、Token验证等功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const testResults = [];

// 测试辅助函数
function logTest(name, passed, message = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (message) console.log(`   ${message}`);
  testResults.push({ name, passed, message });
}

// 生成随机用户名
function generateUsername() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function runTests() {
  console.log('\n=== 认证模块测试 ===\n');

  let testUser = {
    username: generateUsername(),
    email: `${generateUsername()}@test.com`,
    password: 'test123456'
  };
  let token = '';

  // 测试1: 用户注册
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password
    });

    if (response.data.success && response.data.token) {
      token = response.data.token;
      logTest('用户注册', true, `用户ID: ${response.data.user.id}`);
    } else {
      logTest('用户注册', false, '注册失败');
    }
  } catch (error) {
    logTest('用户注册', false, error.response?.data?.message || error.message);
  }

  // 测试2: 用户名密码登录
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });

    if (response.data.success && response.data.token) {
      token = response.data.token;
      logTest('用户名密码登录', true);
    } else {
      logTest('用户名密码登录', false);
    }
  } catch (error) {
    logTest('用户名密码登录', false, error.response?.data?.message || error.message);
  }

  // 测试3: 邮箱密码登录
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    if (response.data.success && response.data.token) {
      logTest('邮箱密码登录', true);
    } else {
      logTest('邮箱密码登录', false);
    }
  } catch (error) {
    logTest('邮箱密码登录', false, error.response?.data?.message || error.message);
  }

  // 测试4: 错误密码登录
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: 'wrongpassword'
    });

    logTest('错误密码登录（应该失败）', false, '应该返回错误但成功了');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 400) {
      logTest('错误密码登录（应该失败）', true, '正确拒绝了错误密码');
    } else {
      logTest('错误密码登录（应该失败）', false, error.message);
    }
  }

  // 测试5: Token验证
  try {
    const response = await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      logTest('Token验证', true, `用户: ${response.data.data.username}`);
    } else {
      logTest('Token验证', false);
    }
  } catch (error) {
    logTest('Token验证', false, error.response?.data?.message || error.message);
  }

  // 测试6: 无效Token
  try {
    const response = await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: 'Bearer invalid_token_12345' }
    });

    logTest('无效Token（应该失败）', false, '应该返回401但成功了');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('无效Token（应该失败）', true, '正确拒绝了无效Token');
    } else {
      logTest('无效Token（应该失败）', false, error.message);
    }
  }

  // 测试7: 微信登录（测试模式）
  try {
    const testCode = `test_code_${Date.now()}`;
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      code: testCode
    });

    if (response.data.success && response.data.token) {
      logTest('微信登录（测试模式）', true);
    } else {
      logTest('微信登录（测试模式）', false);
    }
  } catch (error) {
    logTest('微信登录（测试模式）', false, error.response?.data?.message || error.message);
  }

  // 输出测试结果
  console.log('\n=== 测试结果汇总 ===');
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  console.log(`通过: ${passed}/${total}`);
  console.log(`成功率: ${((passed / total) * 100).toFixed(2)}%\n`);

  return { passed, total, results: testResults };
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = runTests;
