// 简单的HTTP请求测试
const http = require('http');

// 从前端日志中获取的Token
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsInVzZXJuYW1lIjoiMTIzNDU2NyIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzY2NTU4MjkxLCJleHAiOjE3NjY2NDQ2OTF9.d5cXGqaJUK8wfke3gmQJdlxpKOHiftDc20dqy5n1em8';

function testAPI(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    console.log(`\n=== 测试: ${description} ===`);
    console.log(`请求: GET ${path}`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`响应状态: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`响应数据:`, JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.log(`响应数据:`, data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`请求失败:`, error.message);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  try {
    // 测试我发布的订单
    await testAPI('/api/orders/my-publish?page=1&pageSize=20', '我发布的订单');
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试我接受的订单
    await testAPI('/api/orders/my-accepted?page=1&pageSize=20', '我接受的订单');
    
    console.log('\n✅ 测试完成！请查看后端控制台的调试日志。');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

runTests();
