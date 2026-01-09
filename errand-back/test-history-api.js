const axios = require('axios');

async function testHistoryAPI() {
  try {
    // 首先登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: '123456',
      password: '123456'
    });
    
    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    
    if (!token) {
      console.error('❌ 登录失败，没有返回token');
      return;
    }
    console.log('登录成功，token:', token.substring(0, 20) + '...');
    
    // 测试历史记录接口
    console.log('\n2. 测试历史记录接口...');
    const historyResponse = await axios.get('http://localhost:3000/api/user/history', {
      params: {
        page: 1,
        pageSize: 10,
        type: 'all'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n历史记录响应:');
    console.log(JSON.stringify(historyResponse.data, null, 2));
    
    if (historyResponse.data.data.list.length > 0) {
      console.log('\n✅ 成功！找到', historyResponse.data.data.list.length, '条历史记录');
      console.log('\n前3条记录:');
      historyResponse.data.data.list.slice(0, 3).forEach((item, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log('  类型:', item.type);
        console.log('  操作:', item.action);
        console.log('  标题:', item.title);
        console.log('  描述:', item.description);
        console.log('  金额:', item.amount);
        console.log('  时间:', new Date(item.createTime).toLocaleString());
      });
    } else {
      console.log('\n⚠️ 历史记录为空，可能用户还没有订单');
    }
    
    console.log('\n统计数据:');
    console.log('  总计:', historyResponse.data.data.totalCount);
    console.log('  今天:', historyResponse.data.data.todayCount);
    console.log('  本周:', historyResponse.data.data.weekCount);
    console.log('  本月:', historyResponse.data.data.monthCount);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testHistoryAPI();
