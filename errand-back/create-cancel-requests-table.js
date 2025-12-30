// 创建取消请求表
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createCancelRequestsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'errand_user',
    password: process.env.DB_PASSWORD || 'errand_password_123',
    database: process.env.DB_NAME || 'errand_platform'
  });

  try {
    console.log('开始创建 cancel_requests 表...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS cancel_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        requester_id INT NOT NULL,
        reason TEXT,
        status ENUM('pending', 'agreed', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id),
        INDEX idx_requester_id (requester_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableSQL);
    console.log('✓ cancel_requests 表创建成功');

    // 检查 orders 表是否有 cancel_request_id 字段
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM orders LIKE 'cancel_request_id'
    `);

    if (columns.length === 0) {
      console.log('添加 cancel_request_id 字段到 orders 表...');
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN cancel_request_id INT DEFAULT NULL,
        ADD FOREIGN KEY (cancel_request_id) REFERENCES cancel_requests(id) ON DELETE SET NULL
      `);
      console.log('✓ cancel_request_id 字段添加成功');
    } else {
      console.log('✓ cancel_request_id 字段已存在');
    }

    console.log('\n所有表创建完成！');

  } catch (error) {
    console.error('创建表失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createCancelRequestsTable()
  .then(() => {
    console.log('数据库设置完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库设置失败:', error);
    process.exit(1);
  });
