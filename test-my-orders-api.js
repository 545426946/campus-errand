// 测试用户15的订单API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 用户15的token（从前端日志中获取）
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsInVzZXJuYW1lIjoiMTIzNDU2NyIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzM1MDM0NTI5LCJleHAiOjE3MzUxMjA5Mjl9.YOuKCqJqLqJqLqJqLqJqLqJqLqJqLqJqLqJqLqJqLqI';

async function testAPIs() {
  try {
    console.log('=== 测试用户15的订单API ===\n');
    
    // 1. 测试我发布的订单
    console.log('1. 测试 GET /api/orders/my-publish');
    const publishResponse = await axios.get(`${BASE_URL}/orders/my-publish`, {
      params: { page: 1, pageSize: 20 },
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('响应状态:', publishResponse.status);
    console.log('我发布的订单数量:', publishResponse.data.data?.length || 0);
    console.log('订单数据:', JSON.stringify(publishResponse.data.data, null, 2));
    
    // 2. 测试我接受的订单
    console.log('\n2. 测试 GET /api/orders/my-accepted');
    const acceptedResponse = await axios.get(`${BASE_URL}/orders/my-accepted`, {
      params: { page: 1, pageSize: 20 },
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('响应状态:', acceptedResponse.status);
    console.log('我接受的订单数量:', acceptedResponse.data.data?.length || 0);
    console.log('订单数据:', JSON.stringify(acceptedResponse.data.data, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testAPIs();
