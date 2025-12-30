const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 登录用户
async function login(username, password = '123456') {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password
    });
    
    if (response.data.code === 0) {
      console.log(`✅ ${username} 登录成功`);
      return {
        token: response.data.data.token,
        userId: response.data.data.user.id,
        username: response.data.data.user.username
      };
    } else {
      console.log(`❌ ${username} 登录失败:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${username} 登录错误:`, error.message);
    return null;
  }
}

// 获取聊天列表
async function getChatList(token) {
  try {
    const response = await axios.get(`${BASE_URL}/messages/chats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.code === 0) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('获取聊天列表失败:', error.message);
    return [];
  }
}

// 获取未读消息数
async function getUnreadCount(token) {
  try {
    const response = await axios.get(`${BASE_URL}/messages/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.code === 0) {
      return response.data.data.count;
    }
    return 0;
  } catch (error) {
    console.error('获取未读消息数失败:', error.message);
    return 0;
  }
}

// 显示聊天列表
function displayChatList(chatList, username) {
  console.log(`\n💬 ${username} 的消息中心（按订单分组）`);
  console.log('='.repeat(100));
  
  if (chatList.length === 0) {
    console.log('暂无消息');
    return;
  }
  
  chatList.forEach((chat, index) => {
    console.log(`\n[${index + 1}] 订单: ${chat.order_title} (ID: ${chat.order_id})`);
    console.log(`    订单状态: ${getOrderStatusText(chat.order_status)}`);
    console.log(`    对方用户: ${chat.other_user_name || '用户'} (ID: ${chat.other_user_id})`);
    console.log(`    对方头像: ${chat.other_user_avatar || '无头像'}`);
    console.log(`    最后消息: ${chat.last_message}`);
    console.log(`    消息时间: ${chat.last_message_time}`);
    console.log(`    未读消息: ${chat.unread_count} 条`);
    console.log(`    总消息数: ${chat.message_count} 条`);
  });
  
  console.log('\n' + '='.repeat(100));
}

// 获取订单状态文本
function getOrderStatusText(status) {
  const statusMap = {
    'pending': '待接单',
    'accepted': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
}

// 主测试流程
async function main() {
  console.log('🚀 开始测试消息中心功能\n');
  
  // 1. 登录测试用户
  console.log('📌 步骤 1: 登录测试用户');
  const user1 = await login('testuser1');
  const user2 = await login('testuser2');
  
  if (!user1 || !user2) {
    console.log('❌ 用户登录失败，请先创建测试用户');
    return;
  }
  
  // 2. 获取User1的聊天列表
  console.log('\n📌 步骤 2: 获取User1的消息中心');
  const chatList1 = await getChatList(user1.token);
  displayChatList(chatList1, user1.username);
  
  // 3. 获取User1的未读消息数
  console.log('\n📌 步骤 3: 获取User1的未读消息数');
  const unreadCount1 = await getUnreadCount(user1.token);
  console.log(`未读消息数: ${unreadCount1}`);
  
  // 4. 获取User2的聊天列表
  console.log('\n📌 步骤 4: 获取User2的消息中心');
  const chatList2 = await getChatList(user2.token);
  displayChatList(chatList2, user2.username);
  
  // 5. 获取User2的未读消息数
  console.log('\n📌 步骤 5: 获取User2的未读消息数');
  const unreadCount2 = await getUnreadCount(user2.token);
  console.log(`未读消息数: ${unreadCount2}`);
  
  // 6. 统计信息
  console.log('\n📊 统计信息:');
  console.log('='.repeat(100));
  console.log(`User1 (${user1.username}):`);
  console.log(`  - 会话数: ${chatList1.length}`);
  console.log(`  - 未读消息: ${unreadCount1}`);
  console.log(`  - 订单列表: ${chatList1.map(c => c.order_title).join(', ')}`);
  
  console.log(`\nUser2 (${user2.username}):`);
  console.log(`  - 会话数: ${chatList2.length}`);
  console.log(`  - 未读消息: ${unreadCount2}`);
  console.log(`  - 订单列表: ${chatList2.map(c => c.order_title).join(', ')}`);
  
  console.log('\n✅ 测试完成！');
  
  // 7. 验证数据结构
  console.log('\n📌 步骤 6: 验证数据结构');
  if (chatList1.length > 0) {
    const sample = chatList1[0];
    console.log('\n示例数据结构:');
    console.log(JSON.stringify(sample, null, 2));
    
    console.log('\n✓ 检查点:');
    console.log(`  - 包含 order_id: ${sample.order_id ? '✓' : '✗'}`);
    console.log(`  - 包含 order_title: ${sample.order_title ? '✓' : '✗'}`);
    console.log(`  - 包含 order_status: ${sample.order_status ? '✓' : '✗'}`);
    console.log(`  - 包含 other_user_id: ${sample.other_user_id ? '✓' : '✗'}`);
    console.log(`  - 包含 other_user_name: ${sample.other_user_name ? '✓' : '✗'}`);
    console.log(`  - 包含 other_user_avatar: ${sample.other_user_avatar !== undefined ? '✓' : '✗'}`);
    console.log(`  - 包含 last_message: ${sample.last_message ? '✓' : '✗'}`);
    console.log(`  - 包含 last_message_time: ${sample.last_message_time ? '✓' : '✗'}`);
    console.log(`  - 包含 unread_count: ${sample.unread_count !== undefined ? '✓' : '✗'}`);
    console.log(`  - 包含 message_count: ${sample.message_count !== undefined ? '✓' : '✗'}`);
  }
}

// 运行测试
main().catch(error => {
  console.error('测试失败:', error);
});
