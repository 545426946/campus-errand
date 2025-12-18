/**
 * 完整API接口测试脚本
 * 测试所有后端接口是否正常工作
 */

const axios = require('axios');

const BASE_URL = 'http://192.168.1.133:3000/api';
let authToken = '';
let testOrderId = null;
let testNotificationId = null;

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 测试函数
async function test(name, fn) {
  results.total++;
  try {
    await fn();
    results.passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    const errorMsg = error.response?.data?.message || error.message;
    console.log(`❌ ${name}: ${errorMsg}`);
    results.errors.push({ name, error: errorMsg });
  }
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始测试所有API接口...\n');

  // ==================== 一、认证相关接口 ====================
  console.log('📋 测试认证相关接口');
  
  await test('1.1 用户登录（邮箱密码）', async () => {
    const res = await api.post('/auth/login', {
      email: 'student1@example.com',
      password: 'admin123'
    });
    authToken = res.data.token;
    if (!authToken) throw new Error('未获取到token');
  });

  await test('1.2 发送验证码', async () => {
    await api.post('/auth/send-code', {
      phone: '13800138000',
      type: 'login'
    });
  });

  await test('1.3 验证验证码', async () => {
    await api.post('/auth/verify-code', {
      phone: '13800138000',
      code: '123456'
    });
  });

  await test('1.4 获取当前用户信息', async () => {
    await api.get('/auth/me');
  });

  // ==================== 二、用户管理接口 ====================
  console.log('\n📋 测试用户管理接口');

  await test('2.1 获取用户信息', async () => {
    await api.get('/users/profile');
  });

  await test('2.2 更新用户信息', async () => {
    await api.put('/user/info', {
      nickname: '测试用户',
      phone: '13800138000'
    });
  });

  await test('2.3 获取头像', async () => {
    await api.get('/user/avatar');
  });

  await test('2.4 更新头像', async () => {
    await api.post('/user/avatar', {
      avatar: 'http://example.com/avatar.jpg'
    });
  });

  await test('2.5 提交实名认证', async () => {
    await api.post('/user/certify', {
      realName: '张三',
      idCard: '110101199001011234'
    });
  });

  await test('2.6 获取认证状态', async () => {
    await api.get('/user/certification/status');
  });

  await test('2.7 获取认证信息', async () => {
    await api.get('/user/certification/info');
  });

  await test('2.8 获取钱包信息', async () => {
    await api.get('/user/wallet');
  });

  await test('2.9 获取钱包明细', async () => {
    await api.get('/user/wallet/details?page=1&pageSize=10');
  });

  await test('2.10 提现', async () => {
    await api.post('/user/wallet/withdraw', {
      amount: 50,
      account: 'alipay@example.com'
    });
  });

  await test('2.11 充值', async () => {
    await api.post('/user/wallet/recharge', {
      amount: 100,
      paymentMethod: 'wechat'
    });
  });

  await test('2.12 获取收藏列表', async () => {
    await api.get('/user/favorites?page=1&pageSize=10');
  });

  await test('2.13 添加收藏', async () => {
    await api.post('/user/favorites', {
      orderId: 1
    });
  });

  await test('2.14 获取历史记录', async () => {
    await api.get('/user/history?page=1&pageSize=10');
  });

  // ==================== 三、订单核心接口 ====================
  console.log('\n📋 测试订单核心接口');

  await test('3.1 创建订单', async () => {
    const res = await api.post('/orders', {
      title: '测试订单-快递代取',
      description: '帮忙取个快递',
      type: 1,
      price: 5.00,
      pickupLocation: '菜鸟驿站',
      deliveryLocation: '宿舍楼下',
      contactPhone: '13800138000',
      images: []
    });
    testOrderId = res.data.data.orderId;
  });

  await test('3.2 获取订单列表', async () => {
    await api.get('/orders?page=1&pageSize=10');
  });

  await test('3.3 获取订单详情', async () => {
    if (testOrderId) {
      await api.get(`/orders/${testOrderId}`);
    }
  });

  await test('3.4 更新订单', async () => {
    if (testOrderId) {
      await api.put(`/orders/${testOrderId}`, {
        title: '更新后的订单标题'
      });
    }
  });

  await test('3.5 我发布的订单', async () => {
    await api.get('/orders/my-publish?page=1&pageSize=10');
  });

  await test('3.6 我接受的订单', async () => {
    await api.get('/orders/my-accepted?page=1&pageSize=10');
  });

  await test('3.7 搜索订单', async () => {
    await api.get('/orders/search?keyword=快递&page=1&pageSize=10');
  });

  await test('3.8 热门订单', async () => {
    await api.get('/orders/hot?page=1&pageSize=10');
  });

  await test('3.9 推荐订单', async () => {
    await api.get('/orders/recommended?page=1&pageSize=10');
  });

  await test('3.10 订单评价', async () => {
    if (testOrderId) {
      await api.post(`/orders/${testOrderId}/evaluate`, {
        rating: 5,
        comment: '服务很好',
        tags: ['快速', '友好']
      });
    }
  });

  await test('3.11 获取订单评价', async () => {
    if (testOrderId) {
      await api.get(`/orders/${testOrderId}/evaluations`);
    }
  });

  await test('3.12 举报订单', async () => {
    if (testOrderId) {
      await api.post(`/orders/${testOrderId}/report`, {
        reason: '测试举报',
        description: '这是一个测试'
      });
    }
  });

  await test('3.13 分享订单', async () => {
    if (testOrderId) {
      await api.post(`/orders/${testOrderId}/share`);
    }
  });

  // ==================== 四、通知系统接口 ====================
  console.log('\n📋 测试通知系统接口');

  await test('4.1 获取通知列表', async () => {
    const res = await api.get('/notifications?page=1&pageSize=10');
    if (res.data.data.list && res.data.data.list.length > 0) {
      testNotificationId = res.data.data.list[0].id;
    }
  });

  await test('4.2 获取未读通知数量', async () => {
    await api.get('/notifications/unread-count');
  });

  await test('4.3 标记通知已读', async () => {
    if (testNotificationId) {
      await api.put(`/notifications/${testNotificationId}/read`);
    }
  });

  await test('4.4 全部标记已读', async () => {
    await api.put('/notifications/read-all');
  });

  // ==================== 五、系统通用接口 ====================
  console.log('\n📋 测试系统通用接口');

  await test('5.1 获取系统配置', async () => {
    await api.get('/system/config');
  });

  await test('5.2 获取服务类型列表', async () => {
    await api.get('/system/service-types');
  });

  await test('5.3 获取版本信息', async () => {
    await api.get('/system/version');
  });

  await test('5.4 检查更新', async () => {
    await api.post('/system/check-update', {
      version: '1.0.0'
    });
  });

  await test('5.5 获取位置信息', async () => {
    await api.get('/system/location?latitude=39.9042&longitude=116.4074');
  });

  await test('5.6 搜索地点', async () => {
    await api.get('/system/search-location?keyword=北京大学');
  });

  await test('5.7 获取天气信息', async () => {
    await api.get('/system/weather?city=北京');
  });

  await test('5.8 获取公告列表', async () => {
    await api.get('/system/announcements?page=1&pageSize=10');
  });

  await test('5.9 获取热门搜索', async () => {
    await api.get('/system/hot-search');
  });

  await test('5.10 获取推荐关键词', async () => {
    await api.get('/system/recommended-keywords');
  });

  await test('5.11 敏感词检查', async () => {
    await api.post('/system/check-sensitive', {
      content: '这是一段正常的内容'
    });
  });

  await test('5.12 提交意见反馈', async () => {
    await api.post('/system/feedback', {
      type: 'suggestion',
      content: '这是一个测试反馈',
      contact: 'test@example.com'
    });
  });

  await test('5.13 获取帮助信息', async () => {
    await api.get('/system/help');
  });

  await test('5.14 获取关于我们', async () => {
    await api.get('/system/about');
  });

  await test('5.15 获取隐私政策', async () => {
    await api.get('/system/privacy');
  });

  await test('5.16 获取用户协议', async () => {
    await api.get('/system/agreement');
  });

  await test('5.17 图片上传', async () => {
    await api.post('/upload/image', {
      images: ['base64_image_data']
    });
  });

  // ==================== 清理测试数据 ====================
  console.log('\n📋 清理测试数据');

  await test('清理：删除测试订单', async () => {
    if (testOrderId) {
      await api.delete(`/orders/${testOrderId}`);
    }
  });

  await test('清理：退出登录', async () => {
    await api.post('/auth/logout');
  });

  // ==================== 测试结果汇总 ====================
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(50));
  console.log(`总计: ${results.total} 个测试`);
  console.log(`✅ 通过: ${results.passed} 个`);
  console.log(`❌ 失败: ${results.failed} 个`);
  console.log(`成功率: ${((results.passed / results.total) * 100).toFixed(2)}%`);

  if (results.errors.length > 0) {
    console.log('\n失败的测试详情:');
    results.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.name}`);
      console.log(`   错误: ${err.error}`);
    });
  }

  console.log('\n✨ 测试完成！');
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error.message);
  process.exit(1);
});
