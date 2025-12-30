require('dotenv').config();
const db = require('./src/config/database');

async function cleanTestData() {
  console.log('🧹 开始清理测试数据...\n');

  try {
    // 1. 查看当前数据统计
    console.log('📊 当前数据统计:');
    
    const [orders] = await db.execute('SELECT COUNT(*) as count FROM orders');
    console.log(`  订单数: ${orders[0].count}`);
    
    const [messages] = await db.execute('SELECT COUNT(*) as count FROM messages');
    console.log(`  消息数: ${messages[0].count}`);
    
    const [cancelRequests] = await db.execute('SELECT COUNT(*) as count FROM cancel_requests');
    console.log(`  取消请求数: ${cancelRequests[0].count}`);
    
    const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`  用户数: ${users[0].count}`);
    
    // 2. 显示测试用户
    console.log('\n👥 测试用户列表:');
    const [testUsers] = await db.execute(`
      SELECT id, username, nickname, phone 
      FROM users 
      WHERE username LIKE 'test%' OR username LIKE 'user%'
      ORDER BY id
    `);
    
    if (testUsers.length > 0) {
      testUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}, 手机: ${user.phone || '无'}`);
      });
    } else {
      console.log('  未找到测试用户');
    }
    
    // 3. 显示所有订单
    console.log('\n📦 所有订单列表:');
    const [allOrders] = await db.execute(`
      SELECT o.id, o.title, o.status, o.price, 
             u.username as publisher, 
             a.username as acceptor,
             o.created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.acceptor_id = a.id
      ORDER BY o.id
    `);
    
    if (allOrders.length > 0) {
      allOrders.forEach(order => {
        console.log(`  - ID: ${order.id}, 标题: ${order.title}, 状态: ${order.status}, 价格: ¥${order.price}`);
        console.log(`    发布者: ${order.publisher || '未知'}, 接单者: ${order.acceptor || '无'}`);
        console.log(`    创建时间: ${order.created_at}`);
      });
    } else {
      console.log('  没有订单');
    }
    
    // 4. 询问是否删除
    console.log('\n⚠️  警告: 即将删除以下数据:');
    console.log('  1. 所有订单');
    console.log('  2. 所有消息');
    console.log('  3. 所有取消请求');
    console.log('  4. 测试用户（username包含test或user的用户）');
    console.log('\n💡 提示: 如果要执行删除，请修改脚本中的 CONFIRM_DELETE 为 true\n');
    
    // 安全开关 - 需要手动设置为true才会执行删除
    const CONFIRM_DELETE = false;
    
    if (!CONFIRM_DELETE) {
      console.log('❌ 删除未执行（安全保护）');
      console.log('   如需删除，请编辑此文件，将 CONFIRM_DELETE 设置为 true');
      process.exit(0);
    }
    
    // 5. 执行删除（按依赖关系顺序）
    console.log('🗑️  开始删除数据...\n');
    
    // 删除取消请求
    const [deleteCancelRequests] = await db.execute('DELETE FROM cancel_requests');
    console.log(`✅ 删除取消请求: ${deleteCancelRequests.affectedRows} 条`);
    
    // 删除消息
    const [deleteMessages] = await db.execute('DELETE FROM messages');
    console.log(`✅ 删除消息: ${deleteMessages.affectedRows} 条`);
    
    // 删除订单
    const [deleteOrders] = await db.execute('DELETE FROM orders');
    console.log(`✅ 删除订单: ${deleteOrders.affectedRows} 条`);
    
    // 删除测试用户
    const [deleteUsers] = await db.execute(`
      DELETE FROM users 
      WHERE username LIKE 'test%' OR username LIKE 'user%'
    `);
    console.log(`✅ 删除测试用户: ${deleteUsers.affectedRows} 个`);
    
    // 6. 显示清理后的统计
    console.log('\n📊 清理后数据统计:');
    
    const [ordersAfter] = await db.execute('SELECT COUNT(*) as count FROM orders');
    console.log(`  订单数: ${ordersAfter[0].count}`);
    
    const [messagesAfter] = await db.execute('SELECT COUNT(*) as count FROM messages');
    console.log(`  消息数: ${messagesAfter[0].count}`);
    
    const [cancelRequestsAfter] = await db.execute('SELECT COUNT(*) as count FROM cancel_requests');
    console.log(`  取消请求数: ${cancelRequestsAfter[0].count}`);
    
    const [usersAfter] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`  用户数: ${usersAfter[0].count}`);
    
    console.log('\n✅ 测试数据清理完成！');
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// 运行清理
cleanTestData();
