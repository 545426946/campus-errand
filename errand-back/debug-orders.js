const db = require('./src/database/connection');

async function debugUserOrders() {
  try {
    console.log('=== 调试用户订单数据 ===');
    
    // 检查用户15是否存在
    const [users] = await db.execute('SELECT id, username, nickname FROM users WHERE id = ?', [15]);
    console.log('用户15信息:', users);
    
    if (users.length === 0) {
      console.log('❌ 用户15不存在');
      return;
    }
    
    // 检查所有订单
    const [allOrders] = await db.execute('SELECT * FROM orders');
    console.log('数据库中所有订单数量:', allOrders.length);
    console.log('所有订单:', allOrders.map(o => ({id: o.id, user_id: o.user_id, title: o.title, status: o.status})));
    
    // 检查用户15创建的订单
    const [userOrders] = await db.execute('SELECT * FROM orders WHERE user_id = ?', [15]);
    console.log('用户15创建的订单数量:', userOrders.length);
    console.log('用户15创建的订单:', userOrders);
    
    // 检查用户15接受的订单
    const [acceptedOrders] = await db.execute('SELECT * FROM orders WHERE acceptor_id = ?', [15]);
    console.log('用户15接受的订单数量:', acceptedOrders.length);
    console.log('用户15接受的订单:', acceptedOrders);
    
    // 测试SQL查询（与后端API完全一致）
    const testQuery = `
      SELECT o.*, 
        u.nickname as publisher_name, u.username as publisher_username, u.avatar as publisher_avatar,
        a.nickname as acceptor_name, a.username as acceptor_username, a.avatar as acceptor_avatar
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.acceptor_id = a.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    const [testResult] = await db.execute(testQuery, [15]);
    console.log('测试查询结果（应该与API一致）:', testResult);
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    process.exit(0);
  }
}

debugUserOrders();