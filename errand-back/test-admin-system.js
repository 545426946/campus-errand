const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
let adminToken = '';

// 测试管理员登录
async function testLogin() {
  console.log('\n=== 测试管理员登录 ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      adminToken = response.data.data.token;
      console.log('✓ 登录成功');
      console.log('  Token:', adminToken.substring(0, 20) + '...');
      console.log('  管理员:', response.data.data.admin.username);
      return true;
    } else {
      console.log('✗ 登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('✗ 登录错误:', error.message);
    return false;
  }
}

// 测试获取统计数据
async function testStatistics() {
  console.log('\n=== 测试获取统计数据 ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/statistics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✓ 获取统计数据成功');
      console.log('  总用户数:', response.data.data.users.total_users);
      console.log('  总订单数:', response.data.data.orders.total_orders);
      console.log('  待审核认证:', response.data.data.certifications.pending);
      return true;
    } else {
      console.log('✗ 获取统计数据失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('✗ 获取统计数据错误:', error.message);
    return false;
  }
}

// 测试获取用户列表
async function testGetUsers() {
  console.log('\n=== 测试获取用户列表 ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/users?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✓ 获取用户列表成功');
      console.log('  总数:', response.data.data.total);
      console.log('  当前页:', response.data.data.page);
      console.log('  列表数量:', response.data.data.list.length);
      return true;
    } else {
      console.log('✗ 获取用户列表失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('✗ 获取用户列表错误:', error.message);
    return false;
  }
}

// 测试获取订单列表
async function testGetOrders() {
  console.log('\n=== 测试获取订单列表 ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/orders?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✓ 获取订单列表成功');
      console.log('  总数:', response.data.data.total);
      console.log('  当前页:', response.data.data.page);
      console.log('  列表数量:', response.data.data.list.length);
      return true;
    } else {
      console.log('✗ 获取订单列表失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('✗ 获取订单列表错误:', error.message);
    return false;
  }
}

// 测试获取认证列表
async function testGetCertifications() {
  console.log('\n=== 测试获取认证列表 ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/certifications?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✓ 获取认证列表成功');
      console.log('  总数:', response.data.data.total);
      console.log('  当前页:', response.data.data.page);
      console.log('  列表数量:', response.data.data.list.length);
      return true;
    } else {
      console.log('✗ 获取认证列表失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('✗ 获取认证列表错误:', error.message);
    return false;
  }
}

// 测试无效 Token
async function testInvalidToken() {
  console.log('\n=== 测试无效 Token ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/statistics`, {
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    
    console.log('✗ 应该返回 401 错误');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✓ 正确返回 401 未授权错误');
      return true;
    } else {
      console.log('✗ 错误类型不正确:', error.message);
      return false;
    }
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('========================================');
  console.log('管理员系统测试');
  console.log('========================================');
  console.log('请确保后端服务已启动在 http://localhost:3000');
  
  const results = [];
  
  // 测试登录
  results.push(await testLogin());
  
  if (!adminToken) {
    console.log('\n登录失败，无法继续测试');
    return;
  }
  
  // 测试其他功能
  results.push(await testStatistics());
  results.push(await testGetUsers());
  results.push(await testGetOrders());
  results.push(await testGetCertifications());
  results.push(await testInvalidToken());
  
  // 统计结果
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n========================================');
  console.log('测试结果');
  console.log('========================================');
  console.log(`通过: ${passed}/${total}`);
  console.log(`失败: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n✓ 所有测试通过！管理员系统运行正常。');
  } else {
    console.log('\n✗ 部分测试失败，请检查错误信息。');
  }
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行错误:', error);
  process.exit(1);
});
