const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestCertifications() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'errand_platform'
  });

  try {
    console.log('=== 创建测试认证数据 ===\n');

    // 1. 查找一个测试用户
    console.log('1. 查找测试用户...');
    const [users] = await connection.execute(`
      SELECT id, username FROM users LIMIT 1
    `);

    if (users.length === 0) {
      console.log('   ❌ 没有找到用户，请先创建用户');
      return;
    }

    const testUser = users[0];
    console.log(`   ✓ 使用用户: ${testUser.username} (ID: ${testUser.id})\n`);

    // 2. 清除该用户的旧认证记录（可选）
    console.log('2. 清除旧的测试数据...');
    await connection.execute(`
      DELETE FROM certifications WHERE user_id = ?
    `, [testUser.id]);
    console.log('   ✓ 已清除\n');

    // 3. 创建测试认证记录
    console.log('3. 创建测试认证记录...\n');

    // 记录1: 已通过的学生认证
    await connection.execute(`
      INSERT INTO certifications (
        user_id, type, real_name, id_card, student_id, school, 
        college, major, grade, status, submitted_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_SUB(NOW(), INTERVAL 9 DAY)
      )
    `, [
      testUser.id,
      'student',
      '张三',
      '110101199001011234',
      '2023001',
      '北京大学',
      '计算机学院',
      '软件工程',
      '2023级',
      'approved'
    ]);
    console.log('   ✓ 创建记录1: 已通过的学生认证');

    // 记录2: 被拒绝的学生认证
    await connection.execute(`
      INSERT INTO certifications (
        user_id, type, real_name, id_card, student_id, school, 
        college, major, grade, status, reject_reason, submitted_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
      )
    `, [
      testUser.id,
      'student',
      '张三',
      '110101199001011234',
      '2023001',
      '北京大学',
      '计算机学院',
      '软件工程',
      '2023级',
      'rejected',
      '上传的学生证照片不清晰，请重新上传清晰的照片'
    ]);
    console.log('   ✓ 创建记录2: 被拒绝的学生认证');

    // 记录3: 审核中的学生认证
    await connection.execute(`
      INSERT INTO certifications (
        user_id, type, real_name, id_card, student_id, school, 
        college, major, grade, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        DATE_SUB(NOW(), INTERVAL 1 DAY)
      )
    `, [
      testUser.id,
      'student',
      '张三',
      '110101199001011234',
      '2023001',
      '北京大学',
      '计算机学院',
      '软件工程',
      '2023级',
      'pending'
    ]);
    console.log('   ✓ 创建记录3: 审核中的学生认证');

    // 记录4: 已通过的教师认证
    await connection.execute(`
      INSERT INTO certifications (
        user_id, type, real_name, id_card, student_id, school, 
        department, status, submitted_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        DATE_SUB(NOW(), INTERVAL 14 DAY)
      )
    `, [
      testUser.id,
      'teacher',
      '李四',
      '110101198001011234',
      'T2020001',
      '北京大学',
      '计算机学院',
      'approved'
    ]);
    console.log('   ✓ 创建记录4: 已通过的教师认证');

    // 4. 验证创建结果
    console.log('\n4. 验证创建结果...');
    const [records] = await connection.execute(`
      SELECT id, type, real_name, status, submitted_at
      FROM certifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [testUser.id]);

    console.log(`   ✓ 共创建 ${records.length} 条记录\n`);
    
    records.forEach((record, index) => {
      console.log(`   记录 ${index + 1}:`);
      console.log(`      ID: ${record.id}`);
      console.log(`      类型: ${record.type}`);
      console.log(`      姓名: ${record.real_name}`);
      console.log(`      状态: ${record.status}`);
      console.log(`      提交时间: ${record.submitted_at}`);
      console.log('');
    });

    console.log('=== 测试数据创建完成 ===');
    console.log(`\n提示: 可以使用用户 ${testUser.username} (ID: ${testUser.id}) 登录测试历史记录功能`);
  } catch (error) {
    console.error('创建测试数据失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createTestCertifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
