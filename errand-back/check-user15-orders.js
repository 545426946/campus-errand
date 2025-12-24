require('dotenv').config();
const db = require('./src/config/database');

async function checkAndCreateOrders() {
  try {
    console.log('=== 检查用户15的订单 ===\n');
    
    // 1. 检查用户15是否存在
    const [users] = await db.execute('SELECT id, username, nickname FROM users WHERE id = ?', [15]);
    if (users.length === 0) {
      console.log('❌ 用户15不存在，请先创建用户');
      process.exit(1);
    }
    console.log('✅ 用户15存在:', users[0]);
    
    // 2. 检查用户15发布的订单
    const [publishedOrders] = await db.execute(
      'SELECT id, title, status, user_id, acceptor_id FROM orders WHERE user_id = ?',
      [15]
    );
    console.log(`\n用户15发布的订单数量: ${publishedOrders.length}`);
    if (publishedOrders.length > 0) {
      console.log('订单列表:');
      publishedOrders.forEach(o => {
        console.log(`  - ID: ${o.id}, 标题: ${o.title}, 状态: ${o.status}, 接单者: ${o.acceptor_id || '无'}`);
      });
    }
    
    // 3. 检查用户15接受的订单
    const [acceptedOrders] = await db.execute(
      'SELECT id, title, status, user_id, acceptor_id FROM orders WHERE acceptor_id = ?',
      [15]
    );
    console.log(`\n用户15接受的订单数量: ${acceptedOrders.length}`);
    if (acceptedOrders.length > 0) {
      console.log('订单列表:');
      acceptedOrders.forEach(o => {
        console.log(`  - ID: ${o.id}, 标题: ${o.title}, 状态: ${o.status}, 发布者: ${o.user_id}`);
      });
    }
    
    // 4. 如果没有订单，创建一些测试订单
    if (publishedOrders.length === 0 && acceptedOrders.length === 0) {
      console.log('\n⚠️  用户15没有任何订单，创建测试订单...\n');
      
      // 创建用户15发布的订单
      const testOrders = [
        {
          title: '帮我取快递',
          description: '菜鸟驿站有个快递，帮忙取一下',
          type: 'express',
          price: 5,
          pickup_location: '菜鸟驿站',
          delivery_location: '宿舍楼A栋301',
          contact_phone: '13800138000',
          status: 'pending'
        },
        {
          title: '代买奶茶',
          description: '一点点奶茶店，买一杯波霸奶茶',
          type: 'purchase',
          price: 15,
          pickup_location: '一点点奶茶店',
          delivery_location: '图书馆三楼',
          contact_phone: '13800138000',
          status: 'pending'
        },
        {
          title: '送文件到办公室',
          description: '帮忙把文件送到教务处',
          type: 'errand',
          price: 8,
          pickup_location: '宿舍楼B栋',
          delivery_location: '教务处办公室',
          contact_phone: '13800138000',
          status: 'accepted'
        }
      ];
      
      for (const order of testOrders) {
        const [result] = await db.execute(
          `INSERT INTO orders (user_id, title, description, type, price, pickup_location, 
           delivery_location, contact_phone, status, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [15, order.title, order.description, order.type, order.price, 
           order.pickup_location, order.delivery_location, order.contact_phone, order.status]
        );
        console.log(`✅ 创建订单: ${order.title} (ID: ${result.insertId})`);
      }
      
      // 让用户15接受一个其他用户的订单（如果有其他用户的订单）
      const [otherOrders] = await db.execute(
        'SELECT id, title FROM orders WHERE user_id != ? AND acceptor_id IS NULL LIMIT 1',
        [15]
      );
      
      if (otherOrders.length > 0) {
        const orderId = otherOrders[0].id;
        await db.execute(
          'UPDATE orders SET acceptor_id = ?, status = "accepted", accepted_at = NOW() WHERE id = ?',
          [15, orderId]
        );
        console.log(`✅ 用户15接受了订单: ${otherOrders[0].title} (ID: ${orderId})`);
      }
      
      console.log('\n✅ 测试订单创建完成！');
    }
    
    // 5. 再次查询确认
    console.log('\n=== 最终确认 ===');
    const [finalPublished] = await db.execute(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
      [15]
    );
    const [finalAccepted] = await db.execute(
      'SELECT COUNT(*) as count FROM orders WHERE acceptor_id = ?',
      [15]
    );
    console.log(`用户15发布的订单: ${finalPublished[0].count} 条`);
    console.log(`用户15接受的订单: ${finalAccepted[0].count} 条`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAndCreateOrders();
