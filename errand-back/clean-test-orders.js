require('dotenv').config({ path: __dirname + '/.env' });
const db = require('./src/config/database');

async function cleanTestOrders() {
  console.log('🧹 开始清理测试订单...\n');

  try {
    // 1. 查看当前订单统计
    console.log('📊 当前数据统计:');
    
    const [orders] = await db.execute('SELECT COUNT(*) as count FROM orders');
    console.log(`  订单总数: ${orders[0].count}`);
    
    const [messages] = await db.execute('SELECT COUNT(*) as count FROM messages');
    console.log(`  消息总数: ${messages[0].count}`);
    
    const [cancelRequests] = await db.execute('SELECT COUNT(*) as count FROM cancel_requests');
    console.log(`  取消请求总数: ${cancelRequests[0].count}`);
    
    // 2. 显示所有订单详情
    console.log('\n📦 所有订单列表:');
    const [allOrders] = await db.execute(`
      SELECT o.id, o.title, o.status, o.price, 
             u.username as publisher, 
             u.nickname as publisher_nickname,
             a.username as acceptor,
             a.nickname as acceptor_nickname,
             o.created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.acceptor_id = a.id
      ORDER BY o.id
    `);
    
    if (allOrders.length > 0) {
      for (const order of allOrders) {
        console.log(`\n  订单 #${order.id}:`);
        console.log(`    标题: ${order.title}`);
        console.log(`    状态: ${order.status}`);
        console.log(`    价格: ¥${order.price}`);
        console.log(`    发布者: ${order.publisher || '未知'} (${order.publisher_nickname || '无昵称'})`);
        console.log(`    接单者: ${order.acceptor || '无'} (${order.acceptor_nickname || '无昵称'})`);
        console.log(`    创建时间: ${order.created_at}`);
        
        // 查询该订单的消息数
        const [orderMessages] = await db.execute(
          'SELECT COUNT(*) as count FROM messages WHERE order_id = ?',
          [order.id]
        );
        console.log(`    消息数: ${orderMessages[0].count}`);
        
        // 查询该订单的取消请求
        const [orderCancelRequests] = await db.execute(
          'SELECT COUNT(*) as count FROM cancel_requests WHERE order_id = ?',
          [order.id]
        );
        console.log(`    取消请求: ${orderCancelRequests[0].count}`);
      }
    } else {
      console.log('  没有订单');
    }
    
    // 3. 询问是否删除
    console.log('\n⚠️  警告: 即将删除以下数据:');
    console.log(`  - ${orders[0].count} 个订单`);
    console.log(`  - ${messages[0].count} 条消息`);
    console.log(`  - ${cancelRequests[0].count} 个取消请求`);
    console.log('\n  注意: 用户数据将被保留\n');
    
    // 安全开关 - 需要手动设置为true才会执行删除
    const CONFIRM_DELETE = false;
    
    if (!CONFIRM_DELETE) {
      console.log('❌ 删除未执行（安全保护）');
      console.log('   如需删除，请编辑此文件，将 CONFIRM_DELETE 设置为 true');
      console.log('   文件路径: errand-back/clean-test-orders.js');
      process.exit(0);
    }
    
    // 4. 执行删除（按依赖关系顺序）
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
    
    // 5. 显示清理后的统计
    console.log('\n📊 清理后数据统计:');
    
    const [ordersAfter] = await db.execute('SELECT COUNT(*) as count FROM orders');
    console.log(`  订单数: ${ordersAfter[0].count}`);
    
    const [messagesAfter] = await db.execute('SELECT COUNT(*) as count FROM messages');
    console.log(`  消息数: ${messagesAfter[0].count}`);
    
    const [cancelRequestsAfter] = await db.execute('SELECT COUNT(*) as count FROM cancel_requests');
    console.log(`  取消请求数: ${cancelRequestsAfter[0].count}`);
    
    const [usersAfter] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`  用户数: ${usersAfter[0].count} (保留)`);
    
    console.log('\n✅ 测试订单清理完成！');
    console.log('💡 用户数据已保留，可以继续使用现有账号');
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// 运行清理
cleanTestOrders();
