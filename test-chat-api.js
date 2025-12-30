const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户token（需要先登录获取）
let user1Token = '';
let user2Token = '';

// 测试订单ID
let testOrderId = null;

// 辅助函数：发送请求
async function request(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {}
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      if (method === 'get') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

// 1. 登录用户1（发布者）
async function loginUser1() {
  console.log('\n=== 1. 登录用户1（发布者）===');
  const result = await request('post', '/auth/login', {
    username: 'user1',
    password: 'password123'
  });
  
  if (result.code === 0) {
    user1Token = result.data.token;
    console.log('✅ 用户1登录成功');
    console.log('Token:', user1Token.substring(0, 20) + '...');
  } else {
    console.log('❌ 用户1登录失败:', result.message);
  }
}

// 2. 登录用户2（接单者）
async function loginUser2() {
  console.log('\n=== 2. 登录用户2（接单者）===');
  const result = await request('post', '/auth/login', {
    username: 'user2',
    password: 'password123'
  });
  
  if (result.code === 0) {
    user2Token = result.data.token;
    console.log('✅ 用户2登录成功');
    console.log('Token:', user2Token.substring(0, 20) + '...');
  } else {
    console.log('❌ 用户2登录失败:', result.message);
  }
}

// 3. 获取一个已接单的订单
async function getTestOrder() {
  console.log('\n=== 3. 获取测试订单 ===');
  const result = await request('get', '/orders', null, user1Token);
  
  if (result.code === 0 && result.data.length > 0) {
    // 找一个已接单的订单
    const acceptedOrder = result.data.find(o => o.status === 'accepted' && o.acceptor_id);
    
    if (acceptedOrder) {
      testOrderId = acceptedOrder.id;
      console.log('✅ 找到测试订单');
      console.log('订单ID:', testOrderId);
      console.log('订单标题:', acceptedOrder.title);
      console.log('发布者ID:', acceptedOrder.user_id);
      console.log('接单者ID:', acceptedOrder.acceptor_id);
    } else {
      console.log('❌ 没有找到已接单的订单');
      console.log('提示: 请先创建并接单一个订单');
    }
  } else {
    console.log('❌ 获取订单失败:', result.message);
  }
}

// 4. 用户1发送消息给用户2
async function user1SendMessage() {
  if (!testOrderId) {
    console.log('\n⚠️  跳过测试：没有测试订单');
    return;
  }

  console.log('\n=== 4. 用户1发送消息 ===');
  
  // 先获取订单详情，确定接收者ID
  const orderResult = await request('get', `/orders/${testOrderId}`, null, user1Token);
  
  if (orderResult.code !== 0) {
    console.log('❌ 获取订单详情失败:', orderResult.message);
    return;
  }

  const receiverId = orderResult.data.acceptor_id;
  
  const result = await request('post', '/messages', {
    orderId: testOrderId,
    receiverId: receiverId,
    content: '你好，请问什么时候可以帮我取快递？',
    type: 'text'
  }, user1Token);
  
  if (result.code === 0) {
    console.log('✅ 消息发送成功');
    console.log('消息ID:', result.data.id);
  } else {
    console.log('❌ 消息发送失败:', result.message);
  }
}

// 5. 用户2发送消息给用户1
async function user2SendMessage() {
  if (!testOrderId) {
    console.log('\n⚠️  跳过测试：没有测试订单');
    return;
  }

  console.log('\n=== 5. 用户2发送消息 ===');
  
  // 先获取订单详情，确定接收者ID
  const orderResult = await request('get', `/orders/${testOrderId}`, null, user2Token);
  
  if (orderResult.code !== 0) {
    console.log('❌ 获取订单详情失败:', orderResult.message);
    return;
  }

  const receiverId = orderResult.data.user_id;
  
  const result = await request('post', '/messages', {
    orderId: testOrderId,
    receiverId: receiverId,
    content: '好的，我下午3点可以帮你取',
    type: 'text'
  }, user2Token);
  
  if (result.code === 0) {
    console.log('✅ 消息发送成功');
    console.log('消息ID:', result.data.id);
  } else {
    console.log('❌ 消息发送失败:', result.message);
  }
}

// 6. 获取订单聊天记录
async function getOrderMessages() {
  if (!testOrderId) {
    console.log('\n⚠️  跳过测试：没有测试订单');
    return;
  }

  console.log('\n=== 6. 获取订单聊天记录 ===');
  const result = await request('get', `/messages/order/${testOrderId}`, null, user1Token);
  
  if (result.code === 0) {
    console.log(`✅ 获取到 ${result.data.length} 条消息`);
    result.data.forEach((msg, index) => {
      console.log(`\n消息 ${index + 1}:`);
      console.log('  发送者:', msg.sender_name);
      console.log('  接收者:', msg.receiver_name);
      console.log('  内容:', msg.content);
      console.log('  时间:', msg.created_at);
      console.log('  已读:', msg.is_read ? '是' : '否');
    });
  } else {
    console.log('❌ 获取消息失败:', result.message);
  }
}

// 7. 获取聊天列表
async function getChatList() {
  console.log('\n=== 7. 获取聊天列表 ===');
  const result = await request('get', '/messages/chats', null, user1Token);
  
  if (result.code === 0) {
    console.log(`✅ 获取到 ${result.data.length} 个聊天会话`);
    result.data.forEach((chat, index) => {
      console.log(`\n会话 ${index + 1}:`);
      console.log('  订单ID:', chat.order_id);
      console.log('  订单标题:', chat.order_title);
      console.log('  对方:', chat.other_user_name);
      console.log('  最后消息:', chat.last_message);
      console.log('  消息数:', chat.message_count);
      console.log('  未读数:', chat.unread_count);
    });
  } else {
    console.log('❌ 获取聊天列表失败:', result.message);
  }
}

// 8. 获取未读消息数
async function getUnreadCount() {
  console.log('\n=== 8. 获取未读消息数 ===');
  const result = await request('get', '/messages/unread-count', null, user2Token);
  
  if (result.code === 0) {
    console.log('✅ 未读消息数:', result.data.count);
  } else {
    console.log('❌ 获取未读消息数失败:', result.message);
  }
}

// 运行所有测试
async function runTests() {
  console.log('========================================');
  console.log('       聊天功能API测试');
  console.log('========================================');

  try {
    await loginUser1();
    await loginUser2();
    await getTestOrder();
    await user1SendMessage();
    await user2SendMessage();
    await getOrderMessages();
    await getChatList();
    await getUnreadCount();

    console.log('\n========================================');
    console.log('       测试完成');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error.message);
  }
}

// 运行测试
runTests();
