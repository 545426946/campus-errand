// 测试创建订单并检查冻结
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testCreateOrder() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_errand'
  });

  try {
    console.log('=== 测试创建订单流程 ===\n');

    // 获取用户15的当前余额
    const [userBefore] = await connection.execute(
      'SELECT id, balance, frozen_balance FROM users WHERE id = 15'
    );
    console.log('用户15当前状态:', userBefore[0]);

    // 模拟冻结操作
    const userId = 15;
    const amount = 5.00;
    const orderId = 999; // 测试订单ID

    console.log('\n开始模拟冻结操作...');
    console.log('冻结金额:', amount);

    await connection.beginTransaction();

    try {
      // 获取用户当前余额（加锁）
      const [userRows] = await connection.execute(
        'SELECT balance, frozen_balance FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (userRows.length === 0) {
        throw new Error('用户不存在');
      }

      const user = userRows[0];
      const currentBalance = parseFloat(user.balance) || 0;
      const currentFrozen = parseFloat(user.frozen_balance) || 0;

      console.log('当前余额:', currentBalance);
      console.log('当前冻结:', currentFrozen);

      if (currentBalance < amount) {
        throw new Error('余额不足');
      }

      const newBalance = currentBalance - amount;
      const newFrozen = currentFrozen + amount;

      console.log('新余额:', newBalance);
      console.log('新冻结:', newFrozen);

      // 更新用户余额
      const [updateResult] = await connection.execute(
        'UPDATE users SET balance = ?, frozen_balance = ? WHERE id = ?',
        [newBalance, newFrozen, userId]
      );
      console.log('更新结果:', updateResult.affectedRows, '行受影响');

      // 插入交易记录
      const [insertResult] = await connection.execute(
        `INSERT INTO wallet_transactions 
        (user_id, type, amount, balance_before, balance_after, title, description, order_id, status, created_at) 
        VALUES (?, 'freeze', ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [userId, amount, currentBalance, newBalance, '测试冻结', '测试冻结描述', orderId]
      );
      console.log('插入交易记录ID:', insertResult.insertId);

      await connection.commit();
      console.log('\n✓ 冻结操作成功！');

      // 验证结果
      const [userAfter] = await connection.execute(
        'SELECT balance, frozen_balance FROM users WHERE id = ?',
        [userId]
      );
      console.log('冻结后用户状态:', userAfter[0]);

      // 回滚测试数据（恢复原状）
      console.log('\n正在回滚测试数据...');
      await connection.execute(
        'UPDATE users SET balance = ?, frozen_balance = ? WHERE id = ?',
        [currentBalance, currentFrozen, userId]
      );
      await connection.execute(
        'DELETE FROM wallet_transactions WHERE order_id = ?',
        [orderId]
      );
      console.log('✓ 测试数据已回滚');

    } catch (error) {
      await connection.rollback();
      console.error('冻结操作失败:', error.message);
    }

  } catch (error) {
    console.error('测试出错:', error.message);
  } finally {
    await connection.end();
  }
}

testCreateOrder();
