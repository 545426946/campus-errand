// 添加completing状态到orders表
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCompletingStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    console.log('开始添加completing状态...');
    
    // 修改status字段，添加completing状态
    await connection.execute(`
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM('pending', 'accepted', 'completing', 'completed', 'cancelled') 
      DEFAULT 'pending'
    `);
    
    console.log('✅ 成功添加completing状态到orders表');
    
  } catch (error) {
    console.error('❌ 添加失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addCompletingStatus()
  .then(() => {
    console.log('数据库更新完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库更新失败:', error);
    process.exit(1);
  });
