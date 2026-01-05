const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'errand_platform'
  });

  try {
    // 创建管理员表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        email VARCHAR(100),
        role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
        status ENUM('active', 'inactive') DEFAULT 'active',
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ 管理员表创建成功');

    // 创建默认管理员账号（密码：admin123）
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await connection.execute(`
      INSERT INTO admins (username, password, name, email, role)
      VALUES ('admin', ?, '超级管理员', 'admin@errand.com', 'super_admin')
      ON DUPLICATE KEY UPDATE username=username
    `, [hashedPassword]);

    console.log('✓ 默认管理员账号创建成功');
    console.log('  用户名: admin');
    console.log('  密码: admin123');

  } catch (error) {
    console.error('创建管理员表失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createAdminTable()
  .then(() => {
    console.log('\n管理员系统初始化完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('初始化失败:', error);
    process.exit(1);
  });
