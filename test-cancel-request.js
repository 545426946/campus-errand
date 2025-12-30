// 测试取消请求功能
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户token（需要先登录获取）
let publisherToken = ''; // 发布者token
let acceptorToken = '';  // 接单者token
let testOrderId = null;

async function login(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password
    });
    console.log(`✓ ${username} 登录成功`);
    console.log('登录响应:', response.data);
    // 兼容不同的响应格式
    return response.data.token || response.data.data?.token;
  } catch (error) {
    console.error(`✗ ${username} 登录失败:`, error.response?.data || error.message);
    throw error;
  }
}

async function createOrder(token) {
  try {
    const response = await axios.post(`${BASE_URL}/orders`, {
      title: '测试取消协商订单',
      description: '这是一个用于测试取消协商功能的订单',
      type: 1, // 1=快递代取, 2=跑腿服务
      price: 10,
      pickupLocation: '测试取货点',
      deliveryLocation: '测试送货点',
      contactPhone: '13800138000'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 创建订单成功，订单ID:', response.data.data.orderId);
    return response.data.data.orderId;
  } catch (error) {
    console.error('✗ 创建订单失败:', error.response?.data || error.message);
    throw error;
  }
}

async function acceptOrder(orderId, token) {
  try {
    const response = await axios.post(`${BASE_URL}/orders/${orderId}/accept`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 接单成功');
    return response.data;
  } catch (error) {
    console.error('✗ 接单失败:', error.response?.data || error.message);
    throw error;
  }
}

async function createCancelRequest(orderId, token, reason) {
  try {
    const response = await axios.post(`${BASE_URL}/orders/${orderId}/cancel-request`, {
      reason
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 创建取消请求成功');
    return response.data;
  } catch (error) {
    console.error('✗ 创建取消请求失败:', error.response?.data || error.message);
    throw error;
  }
}

async function getCancelRequest(orderId, token) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/${orderId}/cancel-request`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 获取取消请求成功:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('✗ 获取取消请求失败:', error.response?.data || error.message);
    throw error;
  }
}

async function handleCancelRequest(orderId, token, action) {
  try {
    const response = await axios.post(`${BASE_URL}/orders/${orderId}/cancel-request/handle`, {
      action
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✓ ${action === 'agree' ? '同意' : '拒绝'}取消请求成功`);
    return response.data;
  } catch (error) {
    console.error(`✗ ${action === 'agree' ? '同意' : '拒绝'}取消请求失败:`, error.response?.data || error.message);
    throw error;
  }
}

async function getOrderDetail(orderId, token) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 获取订单详情成功，状态:', response.data.data.status);
    return response.data.data;
  } catch (error) {
    console.error('✗ 获取订单详情失败:', error.response?.data || error.message);
    throw error;
  }
}

async function runTest() {
  console.log('=== 开始测试取消请求功能 ===\n');

  try {
    // 1. 登录两个用户
    console.log('步骤 1: 登录用户');
    publisherToken = await login('test1', 'password123');
    acceptorToken = await login('test2', 'password123');
    console.log('');

    // 2. 发布者创建订单
    console.log('步骤 2: 创建订单');
    testOrderId = await createOrder(publisherToken);
    console.log('');

    // 3. 接单者接单
    console.log('步骤 3: 接单');
    await acceptOrder(testOrderId, acceptorToken);
    console.log('');

    // 4. 接单者创建取消请求
    console.log('步骤 4: 接单者创建取消请求');
    await createCancelRequest(testOrderId, acceptorToken, '临时有事，无法完成订单');
    console.log('');

    // 5. 双方查看取消请求
    console.log('步骤 5: 查看取消请求');
    await getCancelRequest(testOrderId, publisherToken);
    await getCancelRequest(testOrderId, acceptorToken);
    console.log('');

    // 6. 发布者同意取消请求
    console.log('步骤 6: 发布者同意取消请求');
    await handleCancelRequest(testOrderId, publisherToken, 'agree');
    console.log('');

    // 7. 查看订单状态
    console.log('步骤 7: 查看订单最终状态');
    await getOrderDetail(testOrderId, publisherToken);
    console.log('');

    console.log('=== 测试完成！所有功能正常 ===');

  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error(error.message);
  }
}

// 运行测试
runTest();
