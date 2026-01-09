require('dotenv').config();
const db = require('./src/config/database');

async function checkUsers() {
  try {
    const [users] = await db.query('SELECT id, username, nickname FROM users LIMIT 10');
    
    console.log('数据库中的用户:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}`);
    });
    
    if (users.length === 0) {
      console.log('\n⚠️ 数据库中没有用户');
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
