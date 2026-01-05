const http = require('http');

console.log('=== 测试后端服务连接 ===\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ 后端服务响应成功!`);
  console.log(`   状态码: ${res.statusCode}`);
  console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`   响应体: ${data}`);
    console.log('\n后端服务运行正常!');
  });
});

req.on('error', (error) => {
  console.error(`❌ 后端服务连接失败: ${error.message}`);
  console.log('\n请手动启动后端服务:');
  console.log('  cd errand-back');
  console.log('  node server.js');
  process.exit(1);
});

req.end();
