// Token 问题测试脚本
const http = require('http');

const BASE_URL = 'http://192.168.1.168:3000/api';

// 简单的 HTTP 请求封装
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: JSON.parse(body)
          };
          resolve(response);
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testTokenFlow() {
  console.log('=== Token 问题修复测试 ===\n');

  try {
    // 1. 登录获取 token
    console.log('1. 测试登录...');
    const loginRes = await request('POST', '/auth/login', {
      username: 'testuser',
      password: 'password123'
    });

    if (loginRes.status !== 200 || !loginRes.data.success) {
      console.error('❌ 登录失败:', loginRes.data.message);
      return;
    }

    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log('✅ 登录成功');
    console.log('   Token:', token.substring(0, 30) + '...');
    console.log('   用户ID:', userId);
    console.log('   Token长度:', token.length);

    // 2. 使用 token 创建订单
    console.log('\n2. 测试创建订单（使用 token）...');
    const orderData = {
      title: 'Token测试订单',
      type: 1,
      description: '测试token是否正常工作',
      pickupLocation: '测试取货点',
      deliveryLocation: '测试送达点',
      contactPhone: '13800138000',
      price: 10.00
    };

    const createRes = await request('POST', '/orders', orderData, {
      'Authorization': `Bearer ${token}`
    });

    if (createRes.status !== 201 || !createRes.data.success) {
      console.error('❌ 创建订单失败:', createRes.data.message);
      return;
    }

    console.log('✅ 创建订单成功');
    console.log('   订单ID:', createRes.data.data.orderId);

    // 3. 验证 token（获取用户信息）
    console.log('\n3. 验证 token（获取用户信息）...');
    const meRes = await request('GET', '/auth/me', null, {
      'Authorization': `Bearer ${token}`
    });

    if (meRes.status !== 200 || !meRes.data.success) {
      console.error('❌ 获取用户信息失败:', meRes.data.message);
      return;
    }

    console.log('✅ Token验证成功');
    console.log('   用户名:', meRes.data.data.username);

    // 4. 测试无效 token
    console.log('\n4. 测试无效 token...');
    const invalidRes = await request('GET', '/auth/me', null, {
      'Authorization': 'Bearer invalid_token_here'
    });

    if (invalidRes.status === 401) {
      console.log('✅ 正确返回401错误');
      console.log('   错误信息:', invalidRes.data.message);
      console.log('   tokenExpired标记:', invalidRes.data.tokenExpired);
    } else {
      console.error('❌ 应该返回401错误，实际返回:', invalidRes.status);
    }

    console.log('\n=== 所有测试通过 ✅ ===');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

// 运行测试
testTokenFlow();
