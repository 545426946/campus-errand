// 测试更新用户资料功能
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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.message || body}`));
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${body}`));
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
    console.log('=== 测试更新用户资料功能 ===\n');

    // 1. 登录获取 token
    console.log('1. 微信登录...');
    const login = await makeRequest('POST', '/auth/wechat/login', {
      code: 'test_code_profile_test',
      nickname: '测试用户',
      avatar: 'test_avatar.jpg'
    });
    console.log('✓ 登录成功');
    console.log('  用户ID:', login.user.id);
    console.log('  昵称:', login.user.nickname);
    const token = login.token;

    // 2. 获取当前用户信息
    console.log('\n2. 获取当前用户信息...');
    const profile1 = await makeRequest('GET', '/user/profile', null, token);
    console.log('✓ 当前信息:');
    console.log('  昵称:', profile1.data.nickname);
    console.log('  邮箱:', profile1.data.email || '未设置');
    console.log('  性别:', profile1.data.gender);
    console.log('  学校:', profile1.data.school || '未设置');

    // 3. 更新用户资料（包含所有字段）
    console.log('\n3. 更新用户资料...');
    try {
      const update = await makeRequest('PUT', '/user/profile', {
        nickname: '更新后的昵称',
        email: 'test@example.com',
        gender: 'other',
        school: '测试大学',
        bio: '这是我的个人简介'
      }, token);
      console.log('✓ 更新成功');
      console.log('  新昵称:', update.data.nickname);
      console.log('  新邮箱:', update.data.email);
      console.log('  新性别:', update.data.gender);
      console.log('  新学校:', update.data.school);
    } catch (error) {
      console.error('✗ 更新失败:', error.message);
      throw error;
    }

    // 4. 再次获取用户信息验证
    console.log('\n4. 验证更新结果...');
    const profile2 = await makeRequest('GET', '/user/profile', null, token);
    console.log('✓ 更新后的信息:');
    console.log('  昵称:', profile2.data.nickname);
    console.log('  邮箱:', profile2.data.email);
    console.log('  性别:', profile2.data.gender);
    console.log('  学校:', profile2.data.school);
    console.log('  简介:', profile2.data.bio);

    // 5. 验证结果
    if (profile2.data.nickname === '更新后的昵称') {
      console.log('\n✅ 测试通过！用户资料更新成功。');
    } else {
      console.log('\n❌ 测试失败！昵称未正确更新。');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

test();
