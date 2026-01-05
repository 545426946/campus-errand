const axios = require('axios');

async function testAdminLogin() {
  console.log('测试管理员登录...\n');
  
  try {
    const response = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✓ 登录成功！');
    console.log('Token:', response.data.data.token.substring(0, 30) + '...');
    console.log('管理员信息:', response.data.data.admin);
    console.log('\n现在可以使用管理后台了！');
    
  } catch (error) {
    console.log('✗ 登录失败');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n可能的原因：');
        console.log('1. 后端服务需要重启以加载新的路由配置');
        console.log('2. 管理员账号未创建（运行 node create-admin-table.js）');
        console.log('\n请重启后端服务：');
        console.log('  1. 停止当前服务（Ctrl+C）');
        console.log('  2. 运行：npm start');
      }
    } else {
      console.log('错误:', error.message);
      console.log('\n请确保后端服务正在运行：npm start');
    }
  }
}

testAdminLogin();
