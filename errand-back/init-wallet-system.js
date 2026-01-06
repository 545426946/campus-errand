const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initWalletSystem() {
  let connection;

  try {
    console.log('=== 开始初始化钱包系统 ===\n');

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✓ 数据库连接成功\n');

    // 执行SQL文件列表
    const sqlFiles = [
      {
        file: 'database/migrations/add-wallet-transactions.sql',
        name: '钱包交易表'
      },
      {
        file: 'database/migrations/add-withdraw-requests.sql',
        name: '提现申请表'
      }
    ];

    // 执行每个SQL文件
    for (const sqlFile of sqlFiles) {
      const filePath = path.join(__dirname, sqlFile.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠ 跳过: ${sqlFile.name} (文件不存在: ${sqlFile.file})`);
        continue;
      }

      console.log(`执行: ${sqlFile.name}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await connection.query(sql);
        console.log(`✓ ${sqlFile.name} 创建成功\n`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠ ${sqlFile.name} 已存在，跳过\n`);
        } else {
          throw error;
        }
      }
    }

    // 检查用户表是否有余额字段
    console.log('检查用户表字段...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'errand_platform' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('balance', 'frozen_balance', 'total_income', 'total_expense')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    const requiredColumns = ['balance', 'frozen_balance', 'total_income', 'total_expense'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`添加缺失的字段: ${missingColumns.join(', ')}...`);
      
      for (const column of missingColumns) {
        await connection.query(`
          ALTER TABLE errand_platform.users 
          ADD COLUMN ${column} DECIMAL(10,2) DEFAULT 0.00 
          COMMENT '${column === 'balance' ? '账户余额' : 
                   column === 'frozen_balance' ? '冻结余额' : 
                   column === 'total_income' ? '累计收入' : '累计支出'}'
        `);
      }
      console.log('✓ 字段添加成功\n');
    } else {
      console.log('✓ 用户表字段完整\n');
    }

    // 初始化测试用户余额
    console.log('初始化测试用户余额...');
    await connection.query(`
      UPDATE errand_platform.users 
      SET balance = 100.00, 
          frozen_balance = 0.00,
          total_income = 100.00,
          total_expense = 0.00
      WHERE id = 15 AND balance = 0
    `);
    console.log('✓ 测试用户余额初始化完成\n');

    console.log('=== 钱包系统初始化完成 ===\n');
    console.log('功能说明：');
    console.log('1. 用户可以充值、提现');
    console.log('2. 提现需要管理员审核');
    console.log('3. 所有交易都有详细记录');
    console.log('4. 支持余额冻结/解冻机制');
    console.log('\n测试账号：');
    console.log('- 用户ID: 15');
    console.log('- 初始余额: ¥100.00');
    console.log('\n可以开始测试钱包功能了！');

  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
initWalletSystem();
