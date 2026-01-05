const mysql = require('mysql2/promise');
require('dotenv').config();

async function createCertificationsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    // 创建认证表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS certifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('student', 'teacher', 'staff') NOT NULL COMMENT '认证类型：学生/教师/职工',
        real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
        id_card VARCHAR(18) NOT NULL COMMENT '身份证号',
        student_id VARCHAR(50) COMMENT '学号/工号',
        school VARCHAR(100) NOT NULL COMMENT '学校名称',
        college VARCHAR(100) COMMENT '学院',
        major VARCHAR(100) COMMENT '专业',
        grade VARCHAR(20) COMMENT '年级',
        department VARCHAR(100) COMMENT '部门（教职工）',
        id_card_front VARCHAR(500) COMMENT '身份证正面照片URL',
        id_card_back VARCHAR(500) COMMENT '身份证背面照片URL',
        student_card VARCHAR(500) COMMENT '学生证/工作证照片URL',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
        reject_reason TEXT COMMENT '拒绝原因',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
        reviewed_at TIMESTAMP NULL COMMENT '审核时间',
        reviewer_id INT COMMENT '审核人ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户身份认证表';
    `);

    console.log('✓ 认证表创建成功');

    // 更新 users 表，添加认证相关字段（如果不存在）
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE COMMENT '是否已认证',
        ADD COLUMN IF NOT EXISTS certification_type ENUM('student', 'teacher', 'staff') COMMENT '认证类型',
        ADD COLUMN IF NOT EXISTS certification_id INT COMMENT '认证记录ID',
        ADD INDEX IF NOT EXISTS idx_is_certified (is_certified);
      `);
      console.log('✓ users 表字段更新成功');
    } catch (error) {
      // 如果字段已存在，忽略错误
      if (!error.message.includes('Duplicate column name')) {
        console.log('⚠ users 表字段可能已存在');
      }
    }

    console.log('\n认证系统数据库初始化完成！');
  } catch (error) {
    console.error('创建认证表失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createCertificationsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
