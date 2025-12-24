const db = require('./src/database/connection');

async function createTestOrder() {
  try {
    console.log('=== 创建测试订单 ===');
    
    // 检查用户15是否存在
    const [users] = await db.execute('SELECT id, username, nickname FROM users WHERE id = ?', [15]);
    console.log('用户15信息:', users);
    
    if (users.length === 0) {
      console.log('❌ 用户15不存在，先创建用户');
      await db.execute(`
        INSERT INTO users (id, username, nickname, role, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [15, 'test_user_15', '测试用户15', 'student']);
      console.log('✅ 已创建用户15');
    }
    
    // 创建测试订单
    const orderData = {
      user_id: 15,
      title: '测试订单 - 跑腿取快递',
      description: '帮我取一个快递，在菜鸟驿站',
      type: 'delivery',
      pickup_location: '学校北门菜鸟驿站',
      delivery_location: '学生宿舍3栋',
      price: 5.00,
      tip: 2.00,
      status: 'pending',
      contact_info: '微信联系：test123',
      images: JSON.stringify([]),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const [result] = await db.execute(`
      INSERT INTO orders (
        user_id, title, description, type, pickup_location, delivery_location, 
        price, tip, status, contact_info, images, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderData.user_id, orderData.title, orderData.description, orderData.type,
      orderData.pickup_location, orderData.delivery_location, orderData.price,
      orderData.tip, orderData.status, orderData.contact_info, orderData.images,
      orderData.created_at, orderData.updated_at
    ]);
    
    console.log('✅ 已创建测试订单，ID:', result.insertId);
    
    // 再创建一个已接受的订单
    const acceptedOrderData = {
      user_id: 15,
      acceptor_id: 15,
      title: '测试订单 - 买奶茶',
      description: '帮我买一杯奶茶',
      type: 'purchase',
      pickup_location: '学校奶茶店',
      delivery_location: '图书馆',
      price: 8.00,
      status: 'accepted',
      contact_info: '电话联系：13800138000',
      images: JSON.stringify([]),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const [result2] = await db.execute(`
      INSERT INTO orders (
        user_id, acceptor_id, title, description, type, pickup_location, delivery_location, 
        price, status, contact_info, images, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      acceptedOrderData.user_id, acceptedOrderData.acceptor_id, acceptedOrderData.title, 
      acceptedOrderData.description, acceptedOrderData.type, acceptedOrderData.pickup_location,
      acceptedOrderData.delivery_location, acceptedOrderData.price, acceptedOrderData.status,
      acceptedOrderData.contact_info, acceptedOrderData.images, acceptedOrderData.created_at,
      acceptedOrderData.updated_at
    ]);
    
    console.log('✅ 已创建已接受订单，ID:', result2.insertId);
    
    // 验证创建的订单
    const [orders] = await db.execute('SELECT * FROM orders WHERE user_id = ?', [15]);
    console.log('用户15的所有订单:', orders);
    
  } catch (error) {
    console.error('创建测试订单失败:', error);
  } finally {
    process.exit(0);
  }
}

createTestOrder();