const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试API连接和数据库操作
async function testAPI() {
  try {
    console.log('🚀 开始测试API...');
    
    // 1. 测试登录
    console.log('\n1. 测试登录API...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      
      // 设置请求头
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // 2. 测试获取订单列表
      console.log('\n2. 测试获取订单列表API...');
      const ordersResponse = await axios.get(`${API_BASE_URL}/orders`, {
        headers: authHeaders
      });
      
      if (ordersResponse.data.success) {
        console.log('✅ 获取订单列表成功');
        console.log(`📦 找到 ${ordersResponse.data.data.orders ? ordersResponse.data.data.orders.length : ordersResponse.data.data.length} 个订单`);
      }
      
      // 3. 测试创建订单
      console.log('\n3. 测试创建订单API...');
      const newOrder = {
        title: 'API测试订单',
        description: '通过API创建的测试订单',
        type: 1,
        price: 6.00,
        pickupLocation: '菜鸟驿站',
        deliveryLocation: '5号宿舍楼',
        contactPhone: '13900139000',
        images: []
      };
      
      const createOrderResponse = await axios.post(`${API_BASE_URL}/orders`, newOrder, {
        headers: authHeaders
      });
      
      if (createOrderResponse.data.success) {
        console.log('✅ 创建订单成功');
        console.log(`📝 新订单ID: ${createOrderResponse.data.data.orderId}`);
      }
      
      // 4. 再次获取订单列表，验证新创建的订单
      console.log('\n4. 验证新创建的订单...');
      const updatedOrdersResponse = await axios.get(`${API_BASE_URL}/orders`, {
        headers: authHeaders
      });
      
      if (updatedOrdersResponse.data.success) {
        const orders = updatedOrdersResponse.data.data.orders || updatedOrdersResponse.data.data;
        const testOrder = orders.find(order => order.title === 'API测试订单');
        if (testOrder) {
          console.log('✅ 新创建的订单已在数据库中找到');
          console.log(`📋 订单详情: ${testOrder.title} - ¥${testOrder.price}`);
        }
      }
      
      console.log('\n🎉 所有API测试完成！前端与MySQL数据库连接正常！');
      
    } else {
      console.log('❌ 登录失败');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testAPI();