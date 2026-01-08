// 检查钱包扣款问题
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkWalletIssue() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    console.log('=== 检查钱包扣款问题 ===\n');

    // 1. 检查 wallet_transactions 表是否存在
    console.log('1. 检查 wallet_transactions 表...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'wallet_transactions'"
    );
    if (tables.length === 0) {
      console.log('❌ wallet_transactions 表不存在！这是问题所在！');
      console.log('   需要运行: node create-wallet-transactions-table.js');
      return;
    }
    console.log('✓ wallet_transactions 表存在\n');

    // 2. 检查 users 表是否有 balance 和 frozen_balance 字段
    console.log('2. 检查 users 表字段...');
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users WHERE Field IN ('balance', 'frozen_balance')"
    );
    console.log('找到字段:', columns.map(c => c.Field).join(', '));
    if (columns.length < 2) {
      console.log('❌ users 表缺少 balance 或 frozen_balance 字段！');
      return;
    }
    console.log('✓ users 表字段完整\n');

    // 3. 查看最近的订单
    console.log('3. 最近创建的订单:');
    const [orders] = await connection.execute(
      'SELECT id, user_id, title, price, status, created_at FROM orders ORDER BY id DESC LIMIT 5'
    );
    console.table(orders);

    // 4. 查看最近的钱包交易记录
    console.log('\n4. 最近的钱包交易记录:');
    const [transactions] = await connection.execute(
      'SELECT id, user_id, type, amount, title, order_id, created_at FROM wallet_transactions ORDER BY id DESC LIMIT 10'
    );
    if (transactions.length === 0) {
      console.log('❌ 没有任何钱包交易记录！冻结功能可能没有正常工作');
    } else {
      console.table(transactions);
    }

    // 5. 查看用户余额情况
    console.log('\n5. 用户余额情况:');
    const [users] = await connection.execute(
      'SELECT id, username, nickname, balance, frozen_balance, total_income, total_expense FROM users WHERE balance > 0 OR frozen_balance > 0 LIMIT 10'
    );
    if (users.length === 0) {
      console.log('没有用户有余额');
    } else {
      console.table(users);
    }

    // 6. 检查订单61的发布者余额
    console.log('\n6. 检查最新订单(id=61)的发布者:');
    const [order61] = await connection.execute(
      'SELECT o.id, o.user_id, o.price, o.status, u.balance, u.frozen_balance FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = 61'
    );
    if (order61.length > 0) {
      console.table(order61);
      const order = order61[0];
      console.log(`订单金额: ${order.price}`);
      console.log(`用户余额: ${order.balance}`);
      console.log(`冻结余额: ${order.frozen_balance}`);
      
      // 检查是否有对应的冻结记录
      const [freezeRecord] = await connection.execute(
        "SELECT * FROM wallet_transactions WHERE order_id = 61 AND type = 'freeze'"
      );
      if (freezeRecord.length === 0) {
        console.log('❌ 订单61没有对应的冻结记录！');
      } else {
        console.log('✓ 找到冻结记录:', freezeRecord[0]);
      }
    }

  } catch (error) {
    console.error('检查出错:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n表不存在，需要创建相关表');
    }
  } finally {
    await connection.end();
  }
}

checkWalletIssue();
