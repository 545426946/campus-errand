const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCertificationColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    console.log('正在检查并添加认证相关字段...');

    // 检查 is_certified 字段是否存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('is_certified', 'certification_type', 'certification_id', 'real_name', 'student_id')
    `, [process.env.DB_NAME || 'errand_platform']);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('已存在的字段:', existingColumns);

    // 添加 is_certified 字段
    if (!existingColumns.includes('is_certified')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN is_certified BOOLEAN DEFAULT FALSE COMMENT '是否已认证'
      `);
      console.log('✓ 添加 is_certified 字段成功');
    } else {
      console.log('⚠ is_certified 字段已存在');
    }

    // 添加 certification_type 字段
    if (!existingColumns.includes('certification_type')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN certification_type ENUM('student', 'teacher', 'staff') COMMENT '认证类型'
      `);
      console.log('✓ 添加 certification_type 字段成功');
    } else {
      console.log('⚠ certification_type 字段已存在');
    }

    // 添加 certification_id 字段
    if (!existingColumns.includes('certification_id')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN certification_id INT COMMENT '认证记录ID'
      `);
      console.log('✓ 添加 certification_id 字段成功');
    } else {
      console.log('⚠ certification_id 字段已存在');
    }

    // 添加 real_name 字段（如果不存在）
    if (!existingColumns.includes('real_name')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN real_name VARCHAR(50) COMMENT '真实姓名'
      `);
      console.log('✓ 添加 real_name 字段成功');
    } else {
      console.log('⚠ real_name 字段已存在');
    }

    // 添加 student_id 字段（如果不存在）
    if (!existingColumns.includes('student_id')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN student_id VARCHAR(50) COMMENT '学号/工号'
      `);
      console.log('✓ 添加 student_id 字段成功');
    } else {
      console.log('⚠ student_id 字段已存在');
    }

    // 添加索引
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD INDEX idx_is_certified (is_certified)
      `);
      console.log('✓ 添加 is_certified 索引成功');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ is_certified 索引已存在');
      } else {
        throw error;
      }
    }

    console.log('\n✅ users 表字段更新完成！');
  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addCertificationColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
