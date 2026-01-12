/**
 * 订单模块测试
 * 测试订单创建、接单、完成、取消等完整流程
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const testResults = [];

function logTest(name, passed, message = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (message) console.log(`   ${message}`);
  testResults.push({ name, passed, message });
}

// 创建测试用户
async function createTestUser(username) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username,
      email: `${username}@test.com`,
      password: 'test123456',
      confirmPassword: 'test123456'
    });
    return response.data.token;
  } catch (error) {
    // 如果用户已存在，尝试登录
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username,
        password: 'test123456'
      });
      return loginResponse.data.token;
    } catch (loginError) {
      throw new Error('无法创建或登录测试用户');
    }
  }
}

// 给用户充值
async function rechargeUser(token, amount) {
  try {
    await axios.post(`${BASE_URL}/user/wallet/recharge`, 
      { amount },
      { headers: { Authorization: `Bearer ${token}` }}
    );
  } catch (error) {
    console.log('充值失败，继续测试...');
  }
}

async function runTests() {
  console.log('\n=== 订单模块测试 ===\n');

  // 创建两个测试用户
  const publisher = `test_publisher_${Date.now()}`;
  const acceptor = `test_acceptor_${Date.now()}`;
  
  let publisherToken, acceptorToken, orderId;

  // 准备测试用户
  try {
    publisherToken = await createTestUser(publisher);
    acceptorToken = await createTestUser(acceptor);
    
    // 给发布者充值
    await rechargeUser(publisherToken, 100);
    
    logTest('准备测试用户', true, '发布者和接单者已创建');
  } catch (error) {
    logTest('准备测试用户', false, error.message);
    return;
  }

  // 测试1: 创建订单（余额充足）
  try {
    const response = await axios.post(`${BASE_URL}/orders`, {
      title: '测试订单-快递代取',
      description: '帮忙取个快递，谢谢',
      type: 1,
      price: 5.00,
      pickupLocation: '菜鸟驿站',
      deliveryLocation: '宿舍楼下',
      contactPhone: '13800138000',
      images: []
    }, {
      headers: { Authorization: `Bearer ${publisherToken}` }
    });

    if (response.data.success && response.data.data.orderId) {
      orderId = response.data.data.orderId;
      logTest('创建订单（余额充足）', true, `订单ID: ${orderId}`);
    } else {
      logTest('创建订单（余额充足）', false);
    }
  } catch (error) {
    logTest('创建订单（余额充足）', false, error.response?.data?.message || error.message);
  }

  // 测试2: 创建订单（余额不足）
  try {
    const response = await axios.post(`${BASE_URL}/orders`, {
      title: '测试订单-余额不足',
      description: '这个订单应该创建失败',
      type: 1,
      price: 10000.00,
      pickupLocation: '菜鸟驿站',
      deliveryLocation: '宿舍楼下',
      contactPhone: '13800138000'
    }, {
      headers: { Authorization: `Bearer ${publisherToken}` }
    });

    logTest('创建订单（余额不足）', false, '应该失败但成功了');
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('余额不足')) {
      logTest('创建订单（余额不足）', true, '正确拒绝了余额不足的订单');
    } else {
      logTest('创建订单（余额不足）', false, error.message);
    }
  }

  // 测试3: 获取订单列表
  try {
    const response = await axios.get(`${BASE_URL}/orders?page=1&pageSize=10`);

    if (response.data.success && Array.isArray(response.data.data)) {
      logTest('获取订单列表', true, `共${response.data.data.length}个订单`);
    } else {
      logTest('获取订单列表', false);
    }
  } catch (error) {
    logTest('获取订单列表', false, error.message);
  }

  // 测试4: 获取订单详情
  if (orderId) {
    try {
      const response = await axios.get(`${BASE_URL}/orders/${orderId}`);

      if (response.data.success && response.data.data) {
        logTest('获取订单详情', true, `订单: ${response.data.data.title}`);
      } else {
        logTest('获取订单详情', false);
      }
    } catch (error) {
      logTest('获取订单详情', false, error.message);
    }
  }

  // 测试5: 接单
  if (orderId) {
    try {
      const response = await axios.post(`${BASE_URL}/orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${acceptorToken}` }
      });

      if (response.data.success) {
        logTest('接单', true);
      } else {
        logTest('接单', false);
      }
    } catch (error) {
      logTest('接单', false, error.response?.data?.message || error.message);
    }
  }

  // 测试6: 不能接自己的单
  try {
    // 创建新订单
    const newOrderResponse = await axios.post(`${BASE_URL}/orders`, {
      title: '测试订单-自己接单',
      description: '测试不能接自己的单',
      type: 1,
      price: 3.00,
      pickupLocation: '菜鸟驿站',
      deliveryLocation: '宿舍楼下',
      contactPhone: '13800138000'
    }, {
      headers: { Authorization: `Bearer ${publisherToken}` }
    });

    const newOrderId = newOrderResponse.data.data.orderId;

    // 尝试接自己的单
    await axios.post(`${BASE_URL}/orders/${newOrderId}/accept`, {}, {
      headers: { Authorization: `Bearer ${publisherToken}` }
    });

    logTest('不能接自己的单', false, '应该失败但成功了');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('不能接自己的单', true, '正确拒绝了接自己的单');
    } else {
      logTest('不能接自己的单', false, error.message);
    }
  }

  // 测试7: 接单者标记完成
  if (orderId) {
    try {
      const response = await axios.post(`${BASE_URL}/orders/${orderId}/complete`, {}, {
        headers: { Authorization: `Bearer ${acceptorToken}` }
      });

      if (response.data.success) {
        logTest('接单者标记完成', true);
      } else {
        logTest('接单者标记完成', false);
      }
    } catch (error) {
      logTest('接单者标记完成', false, error.response?.data?.message || error.message);
    }
  }

  // 测试8: 发布者确认完成
  if (orderId) {
    try {
      const response = await axios.post(`${BASE_URL}/orders/${orderId}/confirm-complete`, {}, {
        headers: { Authorization: `Bearer ${publisherToken}` }
      });

      if (response.data.success) {
        logTest('发布者确认完成', true, '订单完成，款项已转账');
      } else {
        logTest('发布者确认完成', false);
      }
    } catch (error) {
      logTest('发布者确认完成', false, error.response?.data?.message || error.message);
    }
  }

  // 测试9: 取消订单（pending状态）
  try {
    const response = await axios.post(`${BASE_URL}/orders`, {
      title: '测试订单-待取消',
      description: '这个订单将被取消',
      type: 1,
      price: 2.00,
      pickupLocation: '菜鸟驿站',
      deliveryLocation: '宿舍楼下',
      contactPhone: '13800138000'
    }, {
      headers: { Authorization: `Bearer ${publisherToken}` }
    });

    const cancelOrderId = response.data.data.orderId;

    const cancelResponse = await axios.post(`${BASE_URL}/orders/${cancelOrderId}/cancel`, {
      reason: '测试取消'
    }, {
      headers: { Authorization: `Bearer ${publisherToken}` }
    });

    if (cancelResponse.data.success) {
      logTest('取消订单（pending状态）', true, '订单已取消，金额已退还');
    } else {
      logTest('取消订单（pending状态）', false);
    }
  } catch (error) {
    logTest('取消订单（pending状态）', false, error.response?.data?.message || error.message);
  }

  // 测试10: 搜索订单
  try {
    const response = await axios.get(`${BASE_URL}/orders/search?keyword=快递`);

    if (response.data.success) {
      logTest('搜索订单', true, `找到${response.data.data.total}个结果`);
    } else {
      logTest('搜索订单', false);
    }
  } catch (error) {
    logTest('搜索订单', false, error.message);
  }

  // 测试11: 我发布的订单
  try {
    const response = await axios.get(`${BASE_URL}/orders/my-publish`, {
      headers: { Authorization: `Bearer ${publisherToken}` }
    });

    if (response.data.success && Array.isArray(response.data.data)) {
      logTest('我发布的订单', true, `共${response.data.data.length}个订单`);
    } else {
      logTest('我发布的订单', false);
    }
  } catch (error) {
    logTest('我发布的订单', false, error.message);
  }

  // 测试12: 我接受的订单
  try {
    const response = await axios.get(`${BASE_URL}/orders/my-accepted`, {
      headers: { Authorization: `Bearer ${acceptorToken}` }
    });

    if (response.data.success && Array.isArray(response.data.data)) {
      logTest('我接受的订单', true, `共${response.data.data.length}个订单`);
    } else {
      logTest('我接受的订单', false);
    }
  } catch (error) {
    logTest('我接受的订单', false, error.message);
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
