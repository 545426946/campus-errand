// 简单的注册登录测试
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const testUsername = `test_${Date.now()}`;
const testPassword = '123456';

console.log('测试用户名:', testUsername);
console.log('测试密码:', testPassword);
console.log('='.repeat(60));

async function test() {
  try {
    // 1. 注册
    console.log('\n【步骤1】注册新用户');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      username: testUsername,
      password: testPassword,
      confirmPassword: testPassword
    });
    
    console.log('✅ 注册成功');
    console.log('返回数据:', JSON.stringify(registerRes.data, null, 2));
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. 登录
    console.log('\n【步骤2】使用相同账号密码登录');
    console.log('登录参数:', { username: testUsername, password: testPassword });
    
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUsername,
      password: testPassword
    });
    
    console.log('✅ 登录成功');
    console.log('返回数据:', JSON.stringify(loginRes.data, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 测试通过！注册和登录功能正常！');
    
  } catch (error) {
    console.error('\n❌ 测试失败');
    console.error('错误信息:', error.response?.data || error.message);
    console.error('状态码:', error.response?.status);
    
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
