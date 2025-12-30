const mysql = require('mysql2/promise');
require('dotenv').config();

async function createMessagesTable() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'errand_system'
    });

    console.log('已连接到数据库');

    // 检查表是否存在
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'messages'"
    );

    if (tables.length > 0) {
      console.log('messages 表已存在');
      
      // 检查表结构
      const [columns] = await connection.execute(
        "DESCRIBE messages"
      );
      
      console.log('\n当前表结构:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
      
      const answer = await new Promise((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('\n是否要重新创建表？这将删除所有现有数据！(yes/no): ', (answer) => {
          readline.close();
          resolve(answer.toLowerCase());
        });
      });

      if (answer !== 'yes') {
        console.log('操作已取消');
        return;
      }

      // 删除旧表
      await connection.execute('DROP TABLE messages');
      console.log('已删除旧表');
    }

    // 创建 messages 表
    const createTableQuery = `
      CREATE TABLE messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'text',
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_receiver_id (receiver_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('\n✅ messages 表创建成功！');

    // 显示表结构
    const [columns] = await connection.execute('DESCRIBE messages');
    console.log('\n表结构:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    console.log('\n✅ 消息表创建完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      console.error('\n提示: 请确保 orders 和 users 表已经存在');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行脚本
createMessagesTable();
