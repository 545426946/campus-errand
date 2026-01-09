require('dotenv').config();
const db = require('./src/config/database');

async function findUserWithOrders() {
  try {
    // 查找有订单的用户
    const [users] = await db.query(`
      SELECT DISTINCT u.id, u.username, u.nickname,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as published_count,
        (SELECT COUNT(*) FROM orders WHERE acceptor_id = u.id) as accepted_count
      FROM users u
      WHERE EXISTS (SELECT 1 FROM orders WHERE user_id = u.id OR acceptor_id = u.id)
      LIMIT 5
    `);
    
    console.log('有订单的用户:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 发布: ${user.published_count}, 接受: ${user.accepted_count}`);
    });
    
    if (users.length > 0) {
      const userId = users[0].id;
      console.log(`\n使用用户 ${users[0].username} (ID: ${userId}) 的订单:`);
      
      const [orders] = await db.query(
        'SELECT id, title, status, price, created_at FROM orders WHERE user_id = ? OR acceptor_id = ? LIMIT 5',
        [userId, userId]
      );
      
      orders.forEach(order => {
        console.log(`  订单 ${order.id}: ${order.title} - ${order.status} - ¥${order.price}`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    process.exit(0);
  }
}

findUserWithOrders();
