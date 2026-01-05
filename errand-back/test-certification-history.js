const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCertificationHistory() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'errand_platform'
  });

  try {
    console.log('=== 测试认证历史记录功能 ===\n');

    // 1. 检查认证表是否存在
    console.log('1. 检查认证表...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'certifications'"
    );
    console.log(`   ✓ 认证表存在: ${tables.length > 0}\n`);

    // 2. 检查users表字段
    console.log('2. 检查users表字段...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('is_certified', 'certification_type', 'certification_id')
    `, [process.env.DB_NAME || 'errand_platform']);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log(`   ✓ is_certified: ${columnNames.includes('is_certified')}`);
    console.log(`   ✓ certification_type: ${columnNames.includes('certification_type')}`);
    console.log(`   ✓ certification_id: ${columnNames.includes('certification_id')}\n`);

    // 3. 查询认证记录统计
    console.log('3. 认证记录统计...');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM certifications
    `);
    
    console.log(`   总记录数: ${stats[0].total}`);
    console.log(`   审核中: ${stats[0].pending}`);
    console.log(`   已通过: ${stats[0].approved}`);
    console.log(`   已拒绝: ${stats[0].rejected}\n`);

    // 4. 查询最近的认证记录
    console.log('4. 最近的认证记录...');
    const [recentRecords] = await connection.execute(`
      SELECT 
        c.id,
        c.user_id,
        c.type,
        c.real_name,
        c.status,
        c.submitted_at,
        c.reviewed_at,
        u.username
      FROM certifications c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    if (recentRecords.length > 0) {
      recentRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      用户: ${record.username || 'N/A'} (ID: ${record.user_id})`);
        console.log(`      类型: ${record.type}`);
        console.log(`      姓名: ${record.real_name}`);
        console.log(`      状态: ${record.status}`);
        console.log(`      提交时间: ${record.submitted_at}`);
        if (record.reviewed_at) {
          console.log(`      审核时间: ${record.reviewed_at}`);
        }
        console.log('');
      });
    } else {
      console.log('   暂无认证记录\n');
    }

    // 5. 测试历史记录查询（模拟API）
    if (recentRecords.length > 0) {
      const testUserId = recentRecords[0].user_id;
      console.log(`5. 测试用户 ${testUserId} 的历史记录查询...`);
      
      const [history] = await connection.execute(`
        SELECT * FROM certifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `, [testUserId]);

      console.log(`   该用户共有 ${history.length} 条认证记录\n`);
      
      history.forEach((record, index) => {
        console.log(`   记录 ${index + 1}:`);
        console.log(`      状态: ${record.status}`);
        console.log(`      提交时间: ${record.submitted_at}`);
        if (record.reject_reason) {
          console.log(`      拒绝原因: ${record.reject_reason}`);
        }
        console.log('');
      });
    }

    console.log('=== 测试完成 ===');
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

testCertificationHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
