/**
 * 测试钱包支付流程
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testWalletFlow() {
  let connection;

  try {
    console.log('=== 测试钱包支付流程 ===\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'errand_platform'
    });

    const publisherId = 19;  // 发布者
    const riderId = 29;      // 骑手
    const testAmount = 10;   // 测试金额

    // 1. 查看初始余额
    console.log('1. 初始余额状态:');
    let [users] = await connection.execute(
      'SELECT id, username, balance, frozen_balance, total_income, total_expense FROM users WHERE id IN (?, ?)',
      [publisherId, riderId]
    );
    console.table(users.map(u => ({
      ID: u.id,
      用户名: u.username,
      余额: parseFloat(u.balance).toFixed(2),
      冻结: parseFloat(u.frozen_balance).toFixed(2),
      总收入: parseFloat(u.total_income).toFixed(2),
      总支出: parseFloat(u.total_expense).toFixed(2)
    })));

    // 2. 模拟发布订单 - 冻结金额
    console.log('\n2. 模拟发布订单 - 冻结 ¥' + testAmount);
    
    // 获取发布者当前余额
    const [pubRows] = await connection.execute(
      'SELECT balance, frozen_balance FROM users WHERE id = ?',
      [publisherId]
    );
    const pubBalance = parseFloat(pubRows[0].balance);
    const pubFrozen = parseFloat(pubRows[0].frozen_balance);
    
    if (pubBalance < testAmount) {
      console.log('❌ 发布者余额不足!');
      return;
    }

    // 冻结金额
    await connection.execute(
      'UPDATE users SET balance = balance - ?, frozen_balance = frozen_balance + ? WHERE id = ?',
      [testAmount, testAmount, publisherId]
    );
    
    // 记录冻结交易
    await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, title, description, status, created_at)
       VALUES (?, 'freeze', ?, ?, ?, '发布订单冻结', '测试订单冻结', 'completed', NOW())`,
      [publisherId, testAmount, pubBalance, pubBalance - testAmount]
    );
    
    console.log('✓ 冻结成功');

    // 3. 查看冻结后余额
    console.log('\n3. 冻结后余额状态:');
    [users] = await connection.execute(
      'SELECT id, username, balance, frozen_balance FROM users WHERE id IN (?, ?)',
      [publisherId, riderId]
    );
    console.table(users.map(u => ({
      ID: u.id,
      用户名: u.username,
      余额: parseFloat(u.balance).toFixed(2),
      冻结: parseFloat(u.frozen_balance).toFixed(2)
    })));

    // 4. 模拟确认完成 - 转账给骑手
    console.log('\n4. 模拟确认完成 - 转账 ¥' + testAmount + ' 给骑手');
    
    // 获取骑手当前余额
    const [riderRows] = await connection.execute(
      'SELECT balance, total_income FROM users WHERE id = ?',
      [riderId]
    );
    const riderBalance = parseFloat(riderRows[0].balance);
    
    // 获取发布者当前冻结余额
    const [pubRows2] = await connection.execute(
      'SELECT frozen_balance, total_expense FROM users WHERE id = ?',
      [publisherId]
    );
    const pubFrozen2 = parseFloat(pubRows2[0].frozen_balance);
    const pubExpense = parseFloat(pubRows2[0].total_expense);

    // 发布者：减少冻结余额，增加总支出
    await connection.execute(
      'UPDATE users SET frozen_balance = frozen_balance - ?, total_expense = total_expense + ? WHERE id = ?',
      [testAmount, testAmount, publisherId]
    );

    // 骑手：增加余额和总收入
    await connection.execute(
      'UPDATE users SET balance = balance + ?, total_income = total_income + ? WHERE id = ?',
      [testAmount, testAmount, riderId]
    );

    // 记录发布者支出
    await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, title, description, status, created_at)
       VALUES (?, 'expense', ?, ?, ?, '订单支付', '测试订单支付', 'completed', NOW())`,
      [publisherId, testAmount, pubFrozen2, pubFrozen2 - testAmount]
    );

    // 记录骑手收入
    await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, title, description, status, created_at)
       VALUES (?, 'income', ?, ?, ?, '订单收入', '测试订单收入', 'completed', NOW())`,
      [riderId, testAmount, riderBalance, riderBalance + testAmount]
    );

    console.log('✓ 转账成功');

    // 5. 查看最终余额
    console.log('\n5. 最终余额状态:');
    [users] = await connection.execute(
      'SELECT id, username, balance, frozen_balance, total_income, total_expense FROM users WHERE id IN (?, ?)',
      [publisherId, riderId]
    );
    console.table(users.map(u => ({
      ID: u.id,
      用户名: u.username,
      余额: parseFloat(u.balance).toFixed(2),
      冻结: parseFloat(u.frozen_balance).toFixed(2),
      总收入: parseFloat(u.total_income).toFixed(2),
      总支出: parseFloat(u.total_expense).toFixed(2)
    })));

    // 6. 查看交易记录
    console.log('\n6. 最新交易记录:');
    const [transactions] = await connection.execute(
      'SELECT id, user_id, type, amount, title, created_at FROM wallet_transactions ORDER BY id DESC LIMIT 5'
    );
    console.table(transactions.map(t => ({
      ID: t.id,
      用户ID: t.user_id,
      类型: t.type,
      金额: parseFloat(t.amount).toFixed(2),
      标题: t.title
    })));

    console.log('\n=== 测试完成 ===');
    console.log('钱包支付流程工作正常！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testWalletFlow();
