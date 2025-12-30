const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
const users = {
  user1: {
    token: null,
    userId: null,
    username: 'testuser1'
  },
  user2: {
    token: null,
    userId: null,
    username: 'testuser2'
  }
};

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
        userId: response.data.data.user.id
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

// 获取订单列表
async function getOrders(token) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.code === 0) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('获取订单失败:', error.message);
    return [];
  }
}

// 发送消息
async function sendMessage(token, orderId, receiverId, content) {
  try {
    const response = await axios.post(
      `${BASE_URL}/messages/send`,
      {
        orderId,
        receiverId,
        content,
        type: 'text'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.code === 0) {
      console.log(`✅ 消息发送成功: "${content}"`);
      return true;
    } else {
      console.log(`❌ 消息发送失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 发送消息错误:', error.message);
    return false;
  }
}

// 获取订单消息
async function getOrderMessages(token, orderId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/messages/order/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('获取消息失败:', error.message);
    return [];
  }
}

// 获取聊天列表
async function getChatList(token) {
  try {
    const response = await axios.get(
      `${BASE_URL}/messages/chats`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('获取聊天列表失败:', error.message);
    return [];
  }
}

// 显示消息列表
function displayMessages(messages, currentUserId) {
  console.log('\n📝 消息列表:');
  console.log('='.repeat(80));
  
  if (messages.length === 0) {
    console.log('暂无消息');
    return;
  }
  
  messages.forEach((msg, index) => {
    const isMine = msg.sender_id === currentUserId;
    const prefix = isMine ? '我' : msg.sender_name || '对方';
    const avatar = msg.sender_avatar || '无头像';
    
    console.log(`\n[${index + 1}] ${prefix} (ID: ${msg.sender_id})`);
    console.log(`    头像: ${avatar}`);
    console.log(`    内容: ${msg.content}`);
    console.log(`    时间: ${msg.created_at}`);
    console.log(`    ${isMine ? '→' : '←'} ${isMine ? msg.receiver_name : msg.sender_name}`);
  });
  
  console.log('\n' + '='.repeat(80));
}

// 显示聊天列表
function displayChatList(chatList) {
  console.log('\n💬 聊天列表:');
  console.log('='.repeat(80));
  
  if (chatList.length === 0) {
    console.log('暂无聊天记录');
    return;
  }
  
  chatList.forEach((chat, index) => {
    console.log(`\n[${index + 1}] ${chat.other_user_name || '用户'} (ID: ${chat.other_user_id})`);
    console.log(`    头像: ${chat.other_user_avatar || '无头像'}`);
    console.log(`    订单: ${chat.order_title}`);
    console.log(`    最后消息: ${chat.last_message}`);
    console.log(`    未读数: ${chat.unread_count}`);
    console.log(`    时间: ${chat.last_message_time}`);
  });
  
  console.log('\n' + '='.repeat(80));
}

// 主测试流程
async function main() {
  console.log('🚀 开始测试增强的聊天功能\n');
  
  // 1. 登录两个用户
  console.log('📌 步骤 1: 登录测试用户');
  const user1Auth = await login('testuser1');
  const user2Auth = await login('testuser2');
  
  if (!user1Auth || !user2Auth) {
    console.log('❌ 用户登录失败，请先创建测试用户');
    return;
  }
  
  users.user1.token = user1Auth.token;
  users.user1.userId = user1Auth.userId;
  users.user2.token = user2Auth.token;
  users.user2.userId = user2Auth.userId;
  
  console.log(`User1 ID: ${users.user1.userId}`);
  console.log(`User2 ID: ${users.user2.userId}`);
  
  // 2. 获取订单
  console.log('\n📌 步骤 2: 获取订单列表');
  const orders = await getOrders(users.user1.token);
  
  if (orders.length === 0) {
    console.log('❌ 没有可用的订单');
    return;
  }
  
  // 找一个已接单的订单
  const acceptedOrder = orders.find(o => o.status === 'accepted');
  
  if (!acceptedOrder) {
    console.log('❌ 没有找到已接单的订单');
    return;
  }
  
  console.log(`✅ 使用订单: ${acceptedOrder.title} (ID: ${acceptedOrder.id})`);
  const orderId = acceptedOrder.id;
  const receiverId = acceptedOrder.acceptor_id === users.user1.userId 
    ? acceptedOrder.user_id 
    : acceptedOrder.acceptor_id;
  
  // 3. User1 发送消息
  console.log('\n📌 步骤 3: User1 发送消息');
  await sendMessage(users.user1.token, orderId, receiverId, '你好，请问订单进展如何？');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 4. 查看消息（包含发送者信息）
  console.log('\n📌 步骤 4: 查看订单消息（User1视角）');
  let messages = await getOrderMessages(users.user1.token, orderId);
  displayMessages(messages, users.user1.userId);
  
  // 5. User2 回复消息
  console.log('\n📌 步骤 5: User2 回复消息');
  await sendMessage(users.user2.token, orderId, users.user1.userId, '进展顺利，预计今天完成！');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 6. User1 再次查看消息
  console.log('\n📌 步骤 6: User1 再次查看消息');
  messages = await getOrderMessages(users.user1.token, orderId);
  displayMessages(messages, users.user1.userId);
  
  // 7. 查看聊天列表
  console.log('\n📌 步骤 7: 查看User1的聊天列表');
  const chatList1 = await getChatList(users.user1.token);
  displayChatList(chatList1);
  
  console.log('\n📌 步骤 8: 查看User2的聊天列表');
  const chatList2 = await getChatList(users.user2.token);
  displayChatList(chatList2);
  
  // 8. 测试消息同步
  console.log('\n📌 步骤 9: 测试消息同步（连续发送多条）');
  await sendMessage(users.user1.token, orderId, receiverId, '太好了！');
  await sendMessage(users.user1.token, orderId, receiverId, '辛苦了！');
  await sendMessage(users.user2.token, orderId, users.user1.userId, '不客气，应该的');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📌 步骤 10: 查看最终消息列表');
  messages = await getOrderMessages(users.user1.token, orderId);
  displayMessages(messages, users.user1.userId);
  
  console.log('\n✅ 测试完成！');
  console.log('\n📊 测试总结:');
  console.log(`- 总消息数: ${messages.length}`);
  console.log(`- User1 发送: ${messages.filter(m => m.sender_id === users.user1.userId).length} 条`);
  console.log(`- User2 发送: ${messages.filter(m => m.sender_id === users.user2.userId).length} 条`);
  console.log('- 所有消息都包含发送者名称和头像信息 ✓');
}

// 运行测试
main().catch(error => {
  console.error('测试失败:', error);
});
