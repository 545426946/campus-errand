// 测试真实的微信登录流程
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
          const result = JSON.parse(body);
          console.log('  [DEBUG] 响应状态:', res.statusCode);
          console.log('  [DEBUG] 响应数据:', JSON.stringify(result, null, 2));
          resolve(result);
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
    console.log('=== 模拟真实微信登录流程 ===\n');

    const testCode = 'test_code_real_flow'; // 必须以 test_code_ 开头
    
    // 场景1：首次登录，用户授权获取昵称
    console.log('场景1：首次登录，用户授权获取昵称');
    console.log('----------------------------------------');
    const login1 = await makeRequest('POST', '/auth/wechat/login', {
      code: testCode,
      nickname: '张三',
      avatar: 'https://example.com/avatar1.jpg'
    });
    console.log('✓ 登录成功');
    console.log('  用户ID:', login1.user.id);
    console.log('  昵称:', login1.user.nickname);
    console.log('  头像:', login1.user.avatar);
    const userId = login1.user.id;
    let token = login1.token;

    // 场景2：用户在小程序中修改昵称
    console.log('\n场景2：用户在小程序中修改昵称');
    console.log('----------------------------------------');
    const update = await makeRequest('PUT', '/user/profile', {
      nickname: '李四（修改后）'
    }, token);
    console.log('✓ 昵称修改成功');
    console.log('  新昵称:', update.data.nickname);

    // 场景3：用户退出登录，再次登录（用户取消授权）
    console.log('\n场景3：再次登录（用户取消授权，不传nickname）');
    console.log('----------------------------------------');
    const login2 = await makeRequest('POST', '/auth/wechat/login', {
      code: testCode
      // 注意：不传 nickname 和 avatar
    });
    console.log('✓ 登录成功');
    console.log('  用户ID:', login2.user.id);
    console.log('  昵称:', login2.user.nickname);
    console.log('  头像:', login2.user.avatar);
    token = login2.token;

    // 场景4：获取用户信息验证
    console.log('\n场景4：获取用户信息验证');
    console.log('----------------------------------------');
    const profile = await makeRequest('GET', '/user/profile', null, token);
    console.log('✓ 用户信息:');
    console.log('  用户ID:', profile.data.id);
    console.log('  昵称:', profile.data.nickname);
    console.log('  头像:', profile.data.avatar);

    // 验证结果
    console.log('\n=== 验证结果 ===');
    if (profile.data.nickname === '李四（修改后）') {
      console.log('✅ 测试通过！昵称在再次登录后保持为修改后的值。');
    } else {
      console.log('❌ 测试失败！');
      console.log('  期望昵称: 李四（修改后）');
      console.log('  实际昵称:', profile.data.nickname);
    }

    // 场景5：用户再次授权，传递新昵称
    console.log('\n场景5：用户再次授权，传递新昵称');
    console.log('----------------------------------------');
    const login3 = await makeRequest('POST', '/auth/wechat/login', {
      code: testCode,
      nickname: '王五（微信昵称）',
      avatar: 'https://example.com/avatar2.jpg'
    });
    console.log('✓ 登录成功');
    console.log('  昵称:', login3.user.nickname);
    console.log('  说明: 用户主动授权时，会更新为微信昵称');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

test();
