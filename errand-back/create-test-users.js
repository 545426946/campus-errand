// 直接在数据库中创建测试用户
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'errand_user',
    password: process.env.DB_PASSWORD || 'errand_password_123',
    database: process.env.DB_NAME || 'errand_platform'
  });

  try {
    console.log('开始创建测试用户...');

    // 测试用户数据
    const users = [
      { username: 'test1', password: 'password123', nickname: '测试用户1', phone: '13800138001' },
      { username: 'test2', password: 'password123', nickname: '测试用户2', phone: '13800138002' }
    ];

    for (const user of users) {
      // 检查用户是否已存在
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [user.username]
      );

      if (existing.length > 0) {
        console.log(`✓ 用户 ${user.username} 已存在，跳过`);
        continue;
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // 插入用户
      await connection.execute(
        `INSERT INTO users (username, password, nickname, phone, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [user.username, hashedPassword, user.nickname, user.phone]
      );

      console.log(`✓ 创建用户 ${user.username} 成功`);
    }

    console.log('\n所有测试用户创建完成！');
    console.log('用户名: test1, 密码: password123');
    console.log('用户名: test2, 密码: password123');

  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createTestUsers()
  .then(() => {
    console.log('\n✅ 完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 失败:', error.message);
    process.exit(1);
  });
