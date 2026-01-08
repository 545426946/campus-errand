// 修复钱包表外键约束问题
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixWalletFK() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    console.log('=== 修复钱包表外键约束 ===\n');

    // 删除外键约束（order_id 的外键会导致问题）
    console.log('1. 删除 order_id 外键约束...');
    try {
      await connection.execute('ALTER TABLE wallet_transactions DROP FOREIGN KEY wallet_transactions_ibfk_2');
      console.log('✓ 外键约束已删除');
    } catch (e) {
      if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('外键约束不存在，跳过');
      } else {
        console.log('删除外键时出错:', e.message);
      }
    }

    // 保留 order_id 的索引，但不作为外键
    console.log('\n2. 确保 order_id 索引存在...');
    try {
      await connection.execute('CREATE INDEX idx_order_id ON wallet_transactions(order_id)');
      console.log('✓ 索引已创建');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('索引已存在，跳过');
      } else {
        console.log('创建索引时:', e.message);
      }
    }

    console.log('\n✓ 修复完成！现在发布订单应该可以正常扣款了。');

  } catch (error) {
    console.error('修复出错:', error.message);
  } finally {
    await connection.end();
  }
}

fixWalletFK();
