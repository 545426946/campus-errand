const http = require('http');

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: JSON.parse(body)
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testProfileUpdate() {
  try {
    // 首先登录获取 token
    console.log('1. 登录获取 token...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'testuser',
      password: 'password123'
    });
    
    if (loginRes.status !== 200) {
      console.error('登录失败:', loginRes.data);
      return;
    }
    
    const token = loginRes.data.token;
    console.log('登录成功，token:', token.substring(0, 20) + '...');
    
    // 测试更新个人资料
    console.log('\n2. 更新个人资料...');
    const updateData = {
      nickname: "微信用户01",
      phone: "",
      email: "",
      gender: "other",
      school: "",
      bio: ""
    };
    
    console.log('发送数据:', updateData);
    
    const updateRes = await makeRequest('PUT', '/api/user/profile', updateData, token);
    
    console.log('\n响应状态码:', updateRes.status);
    console.log('响应数据:', JSON.stringify(updateRes.data, null, 2));
    
    if (updateRes.status === 200) {
      console.log('\n✅ 更新成功！');
    } else {
      console.log('\n❌ 更新失败！');
    }
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

testProfileUpdate();
