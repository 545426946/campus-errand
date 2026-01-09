require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function createTestUser() {
  try {
    // 检查用户是否存在
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      ['testuser']
    );
    
    if (existingUsers.length > 0) {
      console.log('测试用户已存在，ID:', existingUsers[0].id);
      return existingUsers[0];
    }
    
    // 创建新用户
    const hashedPassword = await bcrypt.hash('123456', 10);
    const [result] = await db.query(
      'INSERT INTO users (username, password, nickname, balance, frozen_balance) VALUES (?, ?, ?, ?, ?)',
      ['testuser', hashedPassword, '测试用户', 100.00, 0.00]
    );
    
    console.log('✅ 测试用户创建成功！');
    console.log('用户名: testuser');
    console.log('密码: 123456');
    console.log('用户ID:', result.insertId);
    
    return { id: result.insertId };
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
