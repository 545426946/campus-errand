// 更新认证表结构为骑手认证
require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateCertificationsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    console.log('=== 更新认证表结构为骑手认证 ===\n');

    // 检查表是否存在
    const [tables] = await connection.execute("SHOW TABLES LIKE 'certifications'");
    
    if (tables.length === 0) {
      // 创建新表
      console.log('创建 certifications 表...');
      await connection.execute(`
        CREATE TABLE certifications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL COMMENT '用户ID',
          type VARCHAR(20) DEFAULT 'rider' COMMENT '认证类型：rider骑手',
          real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
          id_card VARCHAR(18) NOT NULL COMMENT '身份证号',
          phone VARCHAR(20) COMMENT '联系电话',
          emergency_contact VARCHAR(50) COMMENT '紧急联系人',
          emergency_phone VARCHAR(20) COMMENT '紧急联系电话',
          id_card_front VARCHAR(500) COMMENT '身份证正面照',
          id_card_back VARCHAR(500) COMMENT '身份证背面照',
          health_cert VARCHAR(500) COMMENT '健康证照片',
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
          reject_reason VARCHAR(500) COMMENT '拒绝原因',
          reviewer_id INT COMMENT '审核人ID',
          submitted_at DATETIME COMMENT '提交时间',
          reviewed_at DATETIME COMMENT '审核时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='骑手认证表'
      `);
      console.log('✓ certifications 表创建成功');
    } else {
      // 更新现有表
      console.log('更新现有 certifications 表...');
      
      // 添加新字段
      const fieldsToAdd = [
        { name: 'phone', sql: "ADD COLUMN phone VARCHAR(20) COMMENT '联系电话' AFTER id_card" },
        { name: 'emergency_contact', sql: "ADD COLUMN emergency_contact VARCHAR(50) COMMENT '紧急联系人' AFTER phone" },
        { name: 'emergency_phone', sql: "ADD COLUMN emergency_phone VARCHAR(20) COMMENT '紧急联系电话' AFTER emergency_contact" },
        { name: 'health_cert', sql: "ADD COLUMN health_cert VARCHAR(500) COMMENT '健康证照片' AFTER id_card_back" }
      ];

      for (const field of fieldsToAdd) {
        try {
          await connection.execute(`ALTER TABLE certifications ${field.sql}`);
          console.log(`✓ 添加字段 ${field.name}`);
        } catch (e) {
          if (e.code === 'ER_DUP_FIELDNAME') {
            console.log(`字段 ${field.name} 已存在，跳过`);
          } else {
            console.log(`添加字段 ${field.name} 时出错:`, e.message);
          }
        }
      }

      // 更新 type 字段默认值
      try {
        await connection.execute("ALTER TABLE certifications MODIFY COLUMN type VARCHAR(20) DEFAULT 'rider' COMMENT '认证类型：rider骑手'");
        console.log('✓ 更新 type 字段默认值');
      } catch (e) {
        console.log('更新 type 字段时:', e.message);
      }
    }

    console.log('\n✓ 认证表更新完成！');

  } catch (error) {
    console.error('更新出错:', error.message);
  } finally {
    await connection.end();
  }
}

updateCertificationsTable();
