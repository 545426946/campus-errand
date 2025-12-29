// 检查数据库中 gender 字段的类型
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './errand-back/.env' });

async function checkGenderColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'errand_platform'
  });

  try {
    console.log('检查 users 表的 gender 字段...\n');
    
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'gender'"
    );
    
    if (columns.length > 0) {
      console.log('Gender 字段信息:');
      console.log('  字段名:', columns[0].Field);
      console.log('  类型:', columns[0].Type);
      console.log('  允许NULL:', columns[0].Null);
      console.log('  默认值:', columns[0].Default);
      console.log('  额外信息:', columns[0].Extra);
    } else {
      console.log('❌ gender 字段不存在');
    }
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await connection.end();
  }
}

checkGenderColumn();
