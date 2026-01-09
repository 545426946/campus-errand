require('dotenv').config();
const db = require('./src/config/database');

async function checkOrders() {
  try {
    const userId = 7; // testuser1
    
    // 检查发布的订单
    const [publishedOrders] = await db.query(
      'SELECT id, title, status, price, created_at FROM orders WHERE user_id = ? LIMIT 5',
      [userId]
    );
    
    console.log(`用户 ${userId} 发布的订单 (${publishedOrders.length} 条):`);
    publishedOrders.forEach(order => {
      console.log(`  ID: ${order.id}, 标题: ${order.title}, 状态: ${order.status}, 金额: ¥${order.price}`);
    });
    
    // 检查接受的订单
    const [acceptedOrders] = await db.query(
      'SELECT id, title, status, price, created_at FROM orders WHERE acceptor_id = ? LIMIT 5',
      [userId]
    );
    
    console.log(`\n用户 ${userId} 接受的订单 (${acceptedOrders.length} 条):`);
    acceptedOrders.forEach(order => {
      console.log(`  ID: ${order.id}, 标题: ${order.title}, 状态: ${order.status}, 金额: ¥${order.price}`);
    });
    
    // 检查所有订单
    const [allOrders] = await db.query(
      'SELECT COUNT(*) as count FROM orders'
    );
    
    console.log(`\n数据库中总共有 ${allOrders[0].count} 条订单`);
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    process.exit(0);
  }
}

checkOrders();
