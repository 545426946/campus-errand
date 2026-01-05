const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/admin';

async function testAdminAPIs() {
  try {
    // 1. 登录
    console.log('1. 测试登录...');
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginRes.data.success) {
      console.error('登录失败:', loginRes.data.message);
      return;
    }
    
    const token = loginRes.data.data.token;
    console.log('✓ 登录成功');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // 2. 测试获取用户列表
    console.log('\n2. 测试获取用户列表...');
    try {
      const usersRes = await axios.get(`${BASE_URL}/users`, {
        params: { page: 1, pageSize: 20, keyword: '', certification_status: '' },
        headers
      });
      console.log('✓ 用户列表获取成功');
      console.log('  用户数量:', usersRes.data.data.total);
    } catch (error) {
      console.error('✗ 用户列表获取失败:');
      console.error('  状态码:', error.response?.status);
      console.error('  错误信息:', error.response?.data?.message || error.message);
      console.error('  详细错误:', error.response?.data?.error);
    }
    
    // 3. 测试获取订单列表
    console.log('\n3. 测试获取订单列表...');
    try {
      const ordersRes = await axios.get(`${BASE_URL}/orders`, {
        params: { page: 1, pageSize: 20, keyword: '', status: '' },
        headers
      });
      console.log('✓ 订单列表获取成功');
      console.log('  订单数量:', ordersRes.data.data.total);
    } catch (error) {
      console.error('✗ 订单列表获取失败:');
      console.error('  状态码:', error.response?.status);
      console.error('  错误信息:', error.response?.data?.message || error.message);
      console.error('  详细错误:', error.response?.data?.error);
    }
    
    // 4. 测试获取认证列表
    console.log('\n4. 测试获取认证列表...');
    try {
      const certsRes = await axios.get(`${BASE_URL}/certifications`, {
        params: { page: 1, pageSize: 20, status: '' },
        headers
      });
      console.log('✓ 认证列表获取成功');
      console.log('  认证数量:', certsRes.data.data.total);
    } catch (error) {
      console.error('✗ 认证列表获取失败:');
      console.error('  状态码:', error.response?.status);
      console.error('  错误信息:', error.response?.data?.message || error.message);
      console.error('  详细错误:', error.response?.data?.error);
    }
    
  } catch (error) {
    console.error('测试过程出错:', error.message);
  }
}

testAdminAPIs();
