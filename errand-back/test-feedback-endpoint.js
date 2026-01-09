// 测试反馈历史接口
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testFeedbackEndpoint() {
  try {
    console.log('测试反馈历史接口...\n');

    // 1. 生成测试 token（用户ID=1）
    const token = jwt.sign(
      { id: 1, username: 'admin' },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '1d' }
    );
    
    console.log('1. 生成的测试 Token:');
    console.log(token.substring(0, 50) + '...\n');

    // 2. 测试 API 请求
    const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
    const apiUrl = `${baseUrl}/api/system/feedback/history?page=1&pageSize=20`;
    
    console.log('2. 请求 URL:', apiUrl);
    console.log('   Authorization: Bearer', token.substring(0, 30) + '...\n');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('3. 响应状态:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('\n4. 响应数据:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data && data.data.list) {
      console.log(`\n✅ 成功获取 ${data.data.list.length} 条反馈记录`);
      console.log(`   总数: ${data.data.total}`);
      
      if (data.data.list.length > 0) {
        console.log('\n第一条反馈:');
        const first = data.data.list[0];
        console.log(`  ID: ${first.id}`);
        console.log(`  标题: ${first.title}`);
        console.log(`  类型: ${first.type}`);
        console.log(`  状态: ${first.status}`);
        console.log(`  创建时间: ${first.created_at}`);
      }
    } else {
      console.log('\n❌ 接口返回数据格式不正确');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testFeedbackEndpoint();
