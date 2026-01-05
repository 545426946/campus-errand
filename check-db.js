const mysql = require('mysql2/promise');

(async () => {
  try {
    console.log('=== 检查数据库连接和表结构 ===\n');

    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456'
    });

    console.log('✅ MySQL 连接成功');

    // 检查数据库是否存在
    const [databases] = await conn.execute('SHOW DATABASES LIKE "errand_platform"');
    if (databases.length === 0) {
      console.log('❌ 数据库 errand_platform 不存在');
      console.log('\n请先执行数据库初始化脚本');
      await conn.end();
      return;
    }
    console.log('✅ 数据库 errand_platform 存在');

    // 切换到该数据库
    await conn.execute('USE errand_platform');

    // 检查表
    const [tables] = await conn.execute('SHOW TABLES');
    console.log(`\n📊 数据库中有 ${tables.length} 张表:`);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`   - ${tableName}`);
    });

    // 检查关键表
    const requiredTables = ['users', 'orders', 'wallet_transactions'];
    console.log('\n🔍 检查关键表:');
    for (const table of requiredTables) {
      const exists = tables.some(t => Object.values(t)[0] === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

    // 检查用户数据
    if (tables.some(t => Object.values(t)[0] === 'users')) {
      const [users] = await conn.execute('SELECT COUNT(*) as count FROM users');
      console.log(`\n👥 用户数量: ${users[0].count}`);
    }

    await conn.end();
    console.log('\n✅ 检查完成');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
})();
