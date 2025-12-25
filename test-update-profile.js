// 测试更新用户资料API
const axios = require('axios');

const BASE_URL = 'http://192.168.1.161:3000';

// 测试用的token (用户15) - demo-server格式
const testToken = 'demo_token_15';

async function testUpdateProfile() {
  try {
    console.log('=== 测试更新用户资料API ===');
    
    // 1. 先获取用户信息
    console.log('\n1. 获取当前用户信息...');
    const getResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    console.log('当前用户信息:', JSON.stringify(getResponse.data, null, 2));
    
    // 2. 更新用户信息
    console.log('\n2. 更新用户信息...');
    const updateData = {
      nickname: '测试用户更新',
      phone: '13800138000',
      email: 'test@example.com',
      gender: 'male',
      school: '测试大学',
      bio: '这是测试个人简介'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/api/user/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('更新响应:', JSON.stringify(updateResponse.data, null, 2));
    
    // 3. 再次获取用户信息验证更新
    console.log('\n3. 验证更新结果...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    console.log('更新后用户信息:', JSON.stringify(verifyResponse.data, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUpdateProfile();