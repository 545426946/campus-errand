// 创建意见反馈表
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createFeedbacksTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 创建反馈表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'other' COMMENT '反馈类型: bug/feature/complaint/other',
        title VARCHAR(100) NOT NULL COMMENT '反馈标题',
        content TEXT NOT NULL COMMENT '反馈内容',
        contact VARCHAR(100) COMMENT '联系方式',
        images TEXT COMMENT '图片URL列表(JSON)',
        status ENUM('pending', 'processing', 'resolved', 'closed') DEFAULT 'pending' COMMENT '状态',
        reply TEXT COMMENT '管理员回复',
        replied_at TIMESTAMP NULL COMMENT '回复时间',
        replied_by INT COMMENT '回复管理员ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ feedbacks 表创建成功');
  } catch (error) {
    console.error('创建表失败:', error);
  } finally {
    await connection.end();
  }
}

createFeedbacksTable();
