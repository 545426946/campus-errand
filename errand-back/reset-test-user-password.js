require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function resetPassword() {
  try {
    const username = '123456';
    const newPassword = '123456';
    
    // 生成新密码哈希
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ 密码重置成功！');
      console.log('用户名:', username);
      console.log('新密码:', newPassword);
    } else {
      console.log('❌ 用户不存在');
    }
  } catch (error) {
    console.error('重置密码失败:', error);
  } finally {
    process.exit(0);
  }
}

resetPassword();
