const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const sqlFiles = [
  { file: 'database/migrations/schema.sql', name: '数据库结构' },
  { file: 'database/migrations/add-wallet-transactions.sql', name: '钱包交易表' },
  { file: 'database/migrations/add-notifications-table.sql', name: '通知表' },
  { file: 'database/migrations/add_wechat_fields.sql', name: '微信字段' },
  { file: 'database/migrations/update-user-fields.sql', name: '用户表更新' }
];

console.log('=== 开始数据库初始化 ===\n');

const mysql = require('mysql2/promise');

(async () => {
  try {
    // 1. 连接MySQL
    console.log('1️⃣ 连接 MySQL...');
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456'
    });
    console.log('✅ MySQL 连接成功\n');

    // 2. 创建数据库
    console.log('2️⃣ 创建数据库...');
    await conn.execute('CREATE DATABASE IF NOT EXISTS errand_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 数据库 errand_platform 创建成功\n');

    // 3. 读取并执行 SQL 文件
    for (const sqlFile of sqlFiles) {
      const filePath = path.join(__dirname, sqlFile.file);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ 跳过 ${sqlFile.name} - 文件不存在`);
        continue;
      }

      console.log(`3️⃣ 导入 ${sqlFile.name}...`);
      const sql = fs.readFileSync(filePath, 'utf8');

      // 分割 SQL 语句并逐个执行
      const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

      for (const statement of statements) {
        try {
          await conn.execute(statement);
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
            console.error(`   错误: ${err.message}`);
          }
        }
      }

      console.log(`✅ ${sqlFile.name} 导入成功\n`);
    }

    // 4. 创建测试用户
    console.log('4️⃣ 创建测试用户...');
    try {
      await conn.execute('USE errand_platform');

      const [users] = await conn.execute('SELECT COUNT(*) as count FROM users WHERE id = 15');
      if (users[0].count === 0) {
        await conn.execute(
          `INSERT INTO users (id, username, nickname, balance, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [15, 'user15', '用户15', 30.00]
        );
        console.log('✅ 测试用户 user15 创建成功\n');
      } else {
        console.log('✅ 测试用户已存在\n');
      }
    } catch (err) {
      console.log(`⚠️ 创建测试用户: ${err.message}\n`);
    }

    // 5. 验证
    console.log('5️⃣ 验证数据库...');
    const [tables] = await conn.execute('SHOW TABLES');
    console.log(`   数据库中有 ${tables.length} 张表`);

    await conn.end();

    console.log('\n=== ✅ 数据库初始化完成 ===');
    console.log('\n现在可以启动后端服务了:');
    console.log('  cd errand-back && node server.js');

  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
