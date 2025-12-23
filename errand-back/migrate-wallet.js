const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: '192.168.1.133',
    port: 3306,
    user: 'root',
    password: '123456',
    multipleStatements: true
  });

  try {
    console.log('连接数据库成功');
    
    // 读取迁移文件
    const migrationPath = path.join(__dirname, 'database/migrations/add-wallet-transactions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('执行数据库迁移...');
    await connection.execute(sql);
    
    console.log('✅ 钱包交易记录表创建成功');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();