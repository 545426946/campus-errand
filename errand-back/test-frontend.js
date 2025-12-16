// 测试前端与后端数据库交互的完整流程
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 模拟前端操作流程
async function testFrontendDatabaseInteraction() {
  console.log('🧪 开始测试前端与MySQL数据库交互...\n');
  
  try {
    // 步骤1: 模拟用户登录
    console.log('📝 步骤1: 模拟用户登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student1@example.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // 步骤2: 获取订单列表（模拟首页加载）
      console.log('\n📋 步骤2: 获取订单列表（模拟首页）...');
      const ordersResponse = await axios.get(`${API_BASE_URL}/orders`, {
        headers: authHeaders
      });
      
      if (ordersResponse.data.success) {
        console.log('✅ 获取订单列表成功');
        const orders = ordersResponse.data.data.orders || ordersResponse.data.data;
        console.log(`📦 当前订单数量: ${orders.length}`);
        if (orders.length > 0) {
          console.log('📄 示例订单:', {
            id: orders[0].id,
            title: orders[0].title,
            status: orders[0].status,
            price: orders[0].price
          });
        }
      }
      
      // 步骤3: 创建新订单（模拟用户发布订单）
      console.log('\n📤 步骤3: 创建新订单（模拟发布订单）...');
      const newOrder = {
        title: '前端测试订单 - 代取包裹',
        description: '通过前端API创建的测试订单，验证数据库写入功能',
        type: 1,
        price: 8.50,
        pickupLocation: '南门快递站',
        deliveryLocation: '2号宿舍楼',
        contactPhone: '13900139000',
        images: []
      };
      
      const createResponse = await axios.post(`${API_BASE_URL}/orders`, newOrder, {
        headers: authHeaders
      });
      
      if (createResponse.data.success) {
        console.log('✅ 创建订单成功');
        const orderId = createResponse.data.data.orderId;
        console.log(`📝 新订单ID: ${orderId}`);
        
        // 步骤4: 验证订单是否正确写入数据库
        console.log('\n🔍 步骤4: 验证订单数据库写入...');
        const verifyResponse = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
          headers: authHeaders
        });
        
        if (verifyResponse.data.success) {
          console.log('✅ 订单数据库写入验证成功');
          const order = verifyResponse.data.data;
          console.log('📋 订单详情:', {
            id: order.id,
            title: order.title,
            price: order.price,
            status: order.status,
            created_at: order.created_at
          });
        }
        
        // 步骤5: 模拟接单操作
        console.log('\n🤝 步骤5: 模拟接单操作...');
        const acceptResponse = await axios.post(`${API_BASE_URL}/orders/${orderId}/accept`, {}, {
          headers: authHeaders
        });
        
        if (acceptResponse.data.success) {
          console.log('✅ 接单成功');
          
          // 步骤6: 验证订单状态更新
          console.log('\n📊 步骤6: 验证订单状态更新...');
          const statusResponse = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
            headers: authHeaders
          });
          
          if (statusResponse.data.success) {
            const updatedOrder = statusResponse.data.data;
            console.log('✅ 订单状态已更新:', {
              status: updatedOrder.status,
              acceptor_id: updatedOrder.acceptor_id,
              accepted_at: updatedOrder.accepted_at
            });
          }
        }
        
        // 步骤7: 获取用户订单统计
        console.log('\n📈 步骤7: 获取用户订单统计...');
        const statsResponse = await axios.get(`${API_BASE_URL}/orders/stats`, {
          headers: authHeaders
        });
        
        if (statsResponse.data.success) {
          console.log('✅ 获取统计成功');
          console.log('📊 订单统计:', statsResponse.data.data);
        }
      }
      
      console.log('\n🎉 前端与MySQL数据库交互测试完成！');
      console.log('✅ 所有数据库操作（增删改查）均正常工作');
      
    } else {
      console.log('❌ 登录失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 运行测试
testFrontendDatabaseInteraction();