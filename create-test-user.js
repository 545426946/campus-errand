// 创建测试用户
const http = require('http');

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://192.168.1.168:3000/api' + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function createTestUser() {
  console.log('创建测试用户...\n');

  const res = await request('POST', '/auth/register', {
    username: 'testuser',
    password: 'password123',
    email: 'test@example.com'
  });

  if (res.status === 201 && res.data.success) {
    console.log('✅ 测试用户创建成功');
    console.log('   用户名: testuser');
    console.log('   密码: password123');
    console.log('   用户ID:', res.data.user.id);
  } else {
    console.log('ℹ️  用户可能已存在:', res.data.message);
  }
}

createTestUser();
