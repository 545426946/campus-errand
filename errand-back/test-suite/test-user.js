/**
 * 用户模块测试
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('\n=== 用户模块测试 ===\n');
  
  const results = [];
  
  // 创建测试用户并登录
  const username = `test_${Date.now()}`;
  const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
    username,
    email: `${username}@test.com`,
    password: 'test123456',
    confirmPassword: 'test123456'
  });
  
  const token = registerRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 测试1: 获取用户信息
  try {
    const res = await axios.get(`${BASE_URL}/user/profile`, { headers });
    results.push({ name: '获取用户信息', passed: res.data.success });
    console.log(`✅ 获取用户信息`);
  } catch (error) {
    results.push({ name: '获取用户信息', passed: false });
    console.log(`❌ 获取用户信息: ${error.message}`);
  }

  // 测试2: 更新用户信息
  try {
    const res = await axios.put(`${BASE_URL}/user/info`, {
      nickname: '测试昵称',
      phone: '13800138000'
    }, { headers });
    results.push({ name: '更新用户信息', passed: res.data.success });
    console.log(`✅ 更新用户信息`);
  } catch (error) {
    results.push({ name: '更新用户信息', passed: false });
    console.log(`❌ 更新用户信息: ${error.message}`);
  }

  // 测试3: 获取钱包信息
  try {
    const res = await axios.get(`${BASE_URL}/user/wallet`, { headers });
    results.push({ name: '获取钱包信息', passed: res.data.success });
    console.log(`✅ 获取钱包信息`);
  } catch (error) {
    results.push({ name: '获取钱包信息', passed: false });
    console.log(`❌ 获取钱包信息: ${error.message}`);
  }

  const passed = results.filter(r => r.passed).length;
  return { passed, total: results.length, results };
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = runTests;
