const mysql = require('mysql2/promise');
require('dotenv').config();

async function createWalletTransactionsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    console.log('开始创建 wallet_transactions 表...');

    // 创建钱包交易记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('income', 'expense', 'freeze', 'unfreeze', 'withdraw', 'recharge') NOT NULL COMMENT '交易类型',
        amount DECIMAL(10, 2) NOT NULL COMMENT '交易金额',
        balance_before DECIMAL(10, 2) DEFAULT 0 COMMENT '交易前余额',
        balance_after DECIMAL(10, 2) DEFAULT 0 COMMENT '交易后余额',
        title VARCHAR(100) NOT NULL COMMENT '交易标题',
        description TEXT COMMENT '交易描述',
        related_type VARCHAR(50) COMMENT '关联类型(order/withdraw)',
        related_id INT COMMENT '关联ID',
        order_id INT COMMENT '关联订单ID(兼容旧字段)',
        status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' COMMENT '交易状态',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at),
        INDEX idx_related (related_type, related_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包交易记录表';
    `);

    console.log('✅ wallet_transactions 表创建成功');

    // 检查表结构
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM wallet_transactions
    `);
    
    console.log('\n表结构:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    // 检查是否有数据
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as count FROM wallet_transactions
    `);
    console.log(`\n当前记录数: ${countResult[0].count}`);

  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// 执行创建
createWalletTransactionsTable()
  .then(() => {
    console.log('\n✅ 所有操作完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 操作失败:', error);
    process.exit(1);
  });
