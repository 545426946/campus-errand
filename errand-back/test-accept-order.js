// 测试接单接口
const axios = require('axios');

async function testAcceptOrder() {
  try {
    // 1. 先登录获取token
    console.log('1. 登录获取token...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'student1@example.com',
      password: 'admin123'
    });
    
    console.log('登录成功:', loginRes.data);
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log('Token:', token);
    console.log('User ID:', userId);
    
    // 2. 获取订单列表
    console.log('\n2. 获取订单列表...');
    const ordersRes = await axios.get('http://localhost:3000/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('订单数量:', ordersRes.data.data.length);
    
    // 找一个待接单的订单
    const pendingOrder = ordersRes.data.data.find(o => o.status === 'pending' && o.user_id !== userId);
    
    if (!pendingOrder) {
      console.log('没有可接的订单');
      return;
    }
    
    console.log('找到待接订单:', pendingOrder.id, pendingOrder.title);
    
    // 3. 接单
    console.log('\n3. 接单...');
    const acceptRes = await axios.post(
      `http://localhost:3000/api/orders/${pendingOrder.id}/accept`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('接单成功:', acceptRes.data);
    
  } catch (error) {
    console.error('错误:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
    }
  }
}

testAcceptOrder();
