/**
 * 更新钱包相关表结构
 * 确保支持订单支付功能
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateWalletTables() {
  let connection;

  try {
    console.log('=== 开始更新钱包表结构 ===\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'errand_platform',
      multipleStatements: true
    });

    console.log('✓ 数据库连接成功\n');

    // 1. 检查并更新 wallet_transactions 表的 type 字段
    console.log('检查 wallet_transactions 表...');
    
    try {
      // 先检查表是否存在
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'wallet_transactions'"
      );
      
      if (tables.length === 0) {
        console.log('wallet_transactions 表不存在，创建中...');
        await connection.execute(`
          CREATE TABLE wallet_transactions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL COMMENT '用户ID',
            type ENUM('recharge', 'withdraw', 'income', 'expense', 'freeze', 'unfreeze') NOT NULL COMMENT '交易类型',
            amount DECIMAL(10,2) NOT NULL COMMENT '交易金额',
            balance_before DECIMAL(10,2) DEFAULT 0.00 COMMENT '交易前余额',
            balance_after DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
            title VARCHAR(200) NOT NULL COMMENT '交易标题',
            description TEXT COMMENT '交易描述',
            order_id INT NULL COMMENT '关联订单ID',
            status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'completed' COMMENT '交易状态',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_type (type),
            INDEX idx_status (status),
            INDEX idx_created (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包交易记录表'
        `);
        console.log('✓ wallet_transactions 表创建成功\n');
      } else {
        // 表存在，更新 type 字段的 ENUM 值
        console.log('wallet_transactions 表已存在，更新 type 字段...');
        await connection.execute(`
          ALTER TABLE wallet_transactions 
          MODIFY COLUMN type ENUM('recharge', 'withdraw', 'income', 'expense', 'freeze', 'unfreeze') NOT NULL COMMENT '交易类型'
        `);
        console.log('✓ type 字段更新成功\n');
      }
    } catch (error) {
      if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
        console.log('⚠ type 字段已包含不兼容的值，跳过更新');
      } else {
        console.log('⚠ 更新 type 字段时出错:', error.message);
      }
    }

    // 2. 检查并添加 users 表的钱包字段
    console.log('检查 users 表钱包字段...');
    
    const walletFields = [
      { name: 'balance', type: 'DECIMAL(10,2)', default: '0.00', comment: '账户余额' },
      { name: 'frozen_balance', type: 'DECIMAL(10,2)', default: '0.00', comment: '冻结余额' },
      { name: 'total_income', type: 'DECIMAL(10,2)', default: '0.00', comment: '累计收入' },
      { name: 'total_expense', type: 'DECIMAL(10,2)', default: '0.00', comment: '累计支出' }
    ];

    for (const field of walletFields) {
      try {
        const [columns] = await connection.execute(
          `SHOW COLUMNS FROM users LIKE '${field.name}'`
        );
        
        if (columns.length === 0) {
          await connection.execute(
            `ALTER TABLE users ADD COLUMN ${field.name} ${field.type} DEFAULT ${field.default} COMMENT '${field.comment}'`
          );
          console.log(`✓ 添加字段 ${field.name}`);
        } else {
          console.log(`✓ 字段 ${field.name} 已存在`);
        }
      } catch (error) {
        console.log(`⚠ 处理字段 ${field.name} 时出错:`, error.message);
      }
    }

    // 3. 显示当前用户余额情况
    console.log('\n检查用户余额...');
    const [users] = await connection.execute(
      'SELECT id, username, nickname, balance, frozen_balance, total_income, total_expense FROM users LIMIT 10'
    );
    
    console.log('\n当前用户余额情况:');
    console.table(users.map(u => ({
      ID: u.id,
      用户名: u.username || u.nickname,
      余额: parseFloat(u.balance || 0).toFixed(2),
      冻结: parseFloat(u.frozen_balance || 0).toFixed(2),
      总收入: parseFloat(u.total_income || 0).toFixed(2),
      总支出: parseFloat(u.total_expense || 0).toFixed(2)
    })));

    // 4. 显示最近的交易记录
    console.log('\n最近的交易记录:');
    try {
      const [transactions] = await connection.execute(
        'SELECT id, user_id, type, amount, title, created_at FROM wallet_transactions ORDER BY created_at DESC LIMIT 10'
      );
      
      if (transactions.length > 0) {
        console.table(transactions.map(t => ({
          ID: t.id,
          用户ID: t.user_id,
          类型: t.type,
          金额: parseFloat(t.amount).toFixed(2),
          标题: t.title,
          时间: t.created_at
        })));
      } else {
        console.log('暂无交易记录');
      }
    } catch (error) {
      console.log('查询交易记录失败:', error.message);
    }

    console.log('\n=== 钱包表结构更新完成 ===');
    console.log('\n功能说明:');
    console.log('1. 发布订单时会检查余额并冻结金额');
    console.log('2. 确认完成订单时，冻结金额会转给骑手');
    console.log('3. 取消订单时，冻结金额会退还给发布者');

  } catch (error) {
    console.error('\n❌ 更新失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateWalletTables();
