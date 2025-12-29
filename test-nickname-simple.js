// 简单测试昵称功能
console.log('开始测试...');

const http = require('http');

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    const testCode = 'test_code_12345'; // 使用固定的 code
    
    console.log('\n1. 首次微信登录...');
    const login1 = await makeRequest('POST', '/auth/wechat/login', {
      code: testCode,
      nickname: '初始昵称',
      avatar: 'avatar1.jpg'
    });
    console.log('登录成功，昵称:', login1.user.nickname);
    console.log('用户ID:', login1.user.id);
    const token = login1.token;

    console.log('\n2. 更新昵称...');
    const update = await makeRequest('PUT', '/user/profile', {
      nickname: '修改后的昵称'
    }, token);
    console.log('更新成功，新昵称:', update.data.nickname);

    console.log('\n3. 第二次微信登录（使用相同openid，不传昵称）...');
    const login2 = await makeRequest('POST', '/auth/wechat/login', {
      code: testCode // 使用相同的 code，会得到相同的 openid
    });
    console.log('登录成功，昵称:', login2.user.nickname);
    console.log('用户ID:', login2.user.id);

    console.log('\n4. 获取最新用户信息...');
    const profile = await makeRequest('GET', '/user/profile', null, login2.token);
    console.log('当前昵称:', profile.data.nickname);

    if (profile.data.nickname === '修改后的昵称') {
      console.log('\n✅ 测试通过！昵称保持不变。');
    } else {
      console.log('\n❌ 测试失败！昵称被覆盖了。');
      console.log('期望: 修改后的昵称');
      console.log('实际:', profile.data.nickname);
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

test();
