// 检查反馈数据
require('dotenv').config();
const db = require('./src/config/database');

async function checkFeedbackData() {
  try {
    console.log('检查反馈数据...\n');

    // 1. 检查所有反馈
    console.log('1. 所有反馈记录:');
    const [allFeedbacks] = await db.execute('SELECT * FROM feedbacks ORDER BY created_at DESC');
    console.log(`总共 ${allFeedbacks.length} 条反馈`);
    
    if (allFeedbacks.length > 0) {
      console.log('\n前3条反馈:');
      allFeedbacks.slice(0, 3).forEach(f => {
        console.log(`  ID: ${f.id}, 用户: ${f.user_id}, 标题: ${f.title}, 类型: ${f.type}, 状态: ${f.status}`);
      });
    }

    // 2. 按用户分组统计
    console.log('\n2. 按用户统计:');
    const [userStats] = await db.execute(`
      SELECT user_id, COUNT(*) as count 
      FROM feedbacks 
      GROUP BY user_id 
      ORDER BY count DESC
    `);
    
    if (userStats.length > 0) {
      console.log('用户反馈统计:');
      userStats.forEach(s => {
        console.log(`  用户 ${s.user_id}: ${s.count} 条反馈`);
      });
    } else {
      console.log('没有任何反馈记录');
    }

    // 3. 检查用户表
    console.log('\n3. 用户列表:');
    const [users] = await db.execute('SELECT id, username, nickname FROM users LIMIT 5');
    console.log(`总共 ${users.length} 个用户`);
    users.forEach(u => {
      console.log(`  ID: ${u.id}, 用户名: ${u.username}, 昵称: ${u.nickname || '无'}`);
    });

    // 4. 测试创建反馈（为用户1创建）
    if (users.length > 0) {
      const testUserId = users[0].id;
      console.log(`\n4. 为用户 ${testUserId} 创建测试反馈...`);
      
      const [result] = await db.execute(`
        INSERT INTO feedbacks (user_id, type, title, content, status)
        VALUES (?, 'bug', '测试反馈 - 历史记录', '这是一条用于测试历史记录功能的反馈', 'pending')
      `, [testUserId]);
      
      console.log(`✅ 创建成功，反馈ID: ${result.insertId}`);
      
      // 验证创建
      const [check] = await db.execute('SELECT * FROM feedbacks WHERE id = ?', [result.insertId]);
      console.log('创建的反馈:', check[0]);
    }

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkFeedbackData();
