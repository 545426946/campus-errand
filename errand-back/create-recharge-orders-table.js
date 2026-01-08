/**
 * 创建充值订单表
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRechargeOrdersTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'errand_platform'
  });

  try {
    console.log('=== 创建充值订单表 ===\n');

    // 创建充值订单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recharge_orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '用户ID',
        order_no VARCHAR(64) NOT NULL UNIQUE COMMENT '订单号',
        amount DECIMAL(10, 2) NOT NULL COMMENT '充值金额',
        payment_method VARCHAR(20) DEFAULT 'wechat' COMMENT '支付方式: wechat/alipay',
        status ENUM('pending', 'paid', 'failed', 'closed') DEFAULT 'pending' COMMENT '订单状态',
        transaction_id VARCHAR(64) DEFAULT NULL COMMENT '微信支付交易号',
        fail_reason VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
        paid_at DATETIME DEFAULT NULL COMMENT '支付时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_user_id (user_id),
        INDEX idx_order_no (order_no),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='充值订单表'
    `);

    console.log('✅ recharge_orders 表创建成功');

    // 检查 wallet_transactions 表是否存在
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'wallet_transactions'"
    );

    if (tables.length === 0) {
      // 创建钱包交易记录表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL COMMENT '用户ID',
          type ENUM('income', 'expense', 'freeze', 'unfreeze', 'recharge', 'withdraw') NOT NULL COMMENT '交易类型',
          amount DECIMAL(10, 2) NOT NULL COMMENT '交易金额',
          title VARCHAR(100) NOT NULL COMMENT '交易标题',
          description VARCHAR(255) DEFAULT NULL COMMENT '交易描述',
          balance_before DECIMAL(10, 2) DEFAULT 0 COMMENT '交易前余额',
          balance_after DECIMAL(10, 2) DEFAULT 0 COMMENT '交易后余额',
          order_id VARCHAR(64) DEFAULT NULL COMMENT '关联订单号',
          status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' COMMENT '交易状态',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          INDEX idx_user_id (user_id),
          INDEX idx_type (type),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包交易记录表'
      `);
      console.log('✅ wallet_transactions 表创建成功');
    } else {
      console.log('ℹ️ wallet_transactions 表已存在');
    }

    // 检查 users 表是否有 balance 字段
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'balance'"
    );

    if (columns.length === 0) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0 COMMENT '账户余额',
        ADD COLUMN frozen_balance DECIMAL(10, 2) DEFAULT 0 COMMENT '冻结余额',
        ADD COLUMN total_income DECIMAL(10, 2) DEFAULT 0 COMMENT '累计收入',
        ADD COLUMN total_expense DECIMAL(10, 2) DEFAULT 0 COMMENT '累计支出'
      `);
      console.log('✅ users 表添加余额字段成功');
    } else {
      console.log('ℹ️ users 表已有余额字段');
    }

    console.log('\n=== 数据库表创建完成 ===');

  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createRechargeOrdersTable()
  .then(() => {
    console.log('\n脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
