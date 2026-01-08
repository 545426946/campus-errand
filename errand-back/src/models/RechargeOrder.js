const pool = require('../config/database');

/**
 * 充值订单模型
 * 用于记录用户充值订单，确保支付安全
 */
class RechargeOrder {
  /**
   * 创建充值订单
   */
  static async create(orderData) {
    const {
      userId,
      orderNo,
      amount,
      paymentMethod = 'wechat',
      status = 'pending'
    } = orderData;

    const [result] = await pool.execute(
      `INSERT INTO recharge_orders 
       (user_id, order_no, amount, payment_method, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, orderNo, amount, paymentMethod, status]
    );

    return {
      id: result.insertId,
      orderNo,
      userId,
      amount,
      paymentMethod,
      status
    };
  }

  /**
   * 根据订单号查找订单
   */
  static async findByOrderNo(orderNo) {
    const [rows] = await pool.execute(
      'SELECT * FROM recharge_orders WHERE order_no = ?',
      [orderNo]
    );
    return rows[0] || null;
  }

  /**
   * 根据ID查找订单
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM recharge_orders WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 更新订单状态
   */
  static async updateStatus(orderNo, status, extraData = {}) {
    const updates = ['status = ?', 'updated_at = NOW()'];
    const values = [status];

    if (extraData.transactionId) {
      updates.push('transaction_id = ?');
      values.push(extraData.transactionId);
    }

    if (extraData.paidAt) {
      updates.push('paid_at = ?');
      values.push(extraData.paidAt);
    }

    if (extraData.failReason) {
      updates.push('fail_reason = ?');
      values.push(extraData.failReason);
    }

    values.push(orderNo);

    const [result] = await pool.execute(
      `UPDATE recharge_orders SET ${updates.join(', ')} WHERE order_no = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 获取用户充值订单列表
   */
  static async getUserOrders(userId, options = {}) {
    const { page = 1, pageSize = 20, status } = options;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM recharge_orders ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [rows] = await pool.execute(
      `SELECT * FROM recharge_orders ${whereClause} 
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return {
      list: rows,
      total,
      page,
      pageSize,
      hasMore: offset + rows.length < total
    };
  }

  /**
   * 检查订单是否已支付
   */
  static async isPaid(orderNo) {
    const order = await this.findByOrderNo(orderNo);
    return order && order.status === 'paid';
  }

  /**
   * 标记订单为已支付并更新用户余额
   * 使用事务确保数据一致性
   */
  static async markAsPaidAndUpdateBalance(orderNo, transactionId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. 查找订单（加锁）
      const [orders] = await connection.execute(
        'SELECT * FROM recharge_orders WHERE order_no = ? FOR UPDATE',
        [orderNo]
      );

      if (!orders[0]) {
        throw new Error('订单不存在');
      }

      const order = orders[0];

      if (order.status === 'paid') {
        // 订单已支付，直接返回成功（幂等处理）
        await connection.rollback();
        return { success: true, message: '订单已处理', alreadyPaid: true };
      }

      if (order.status !== 'pending') {
        throw new Error('订单状态异常');
      }

      // 2. 更新订单状态
      await connection.execute(
        `UPDATE recharge_orders 
         SET status = 'paid', transaction_id = ?, paid_at = NOW(), updated_at = NOW()
         WHERE order_no = ?`,
        [transactionId, orderNo]
      );

      // 3. 获取用户当前余额（加锁）
      const [users] = await connection.execute(
        'SELECT balance FROM users WHERE id = ? FOR UPDATE',
        [order.user_id]
      );

      if (!users[0]) {
        throw new Error('用户不存在');
      }

      const currentBalance = parseFloat(users[0].balance) || 0;
      const newBalance = currentBalance + parseFloat(order.amount);

      // 4. 更新用户余额
      await connection.execute(
        'UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?',
        [newBalance, order.user_id]
      );

      // 5. 记录钱包交易（不使用 order_id，因为它有外键约束指向 orders 表）
      await connection.execute(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, title, description, balance_before, balance_after, order_id, status, created_at)
         VALUES (?, 'recharge', ?, '账户充值', ?, ?, ?, NULL, 'completed', NOW())`,
        [
          order.user_id,
          order.amount,
          `微信支付充值 ¥${order.amount}，订单号：${orderNo}`,
          currentBalance.toFixed(2),
          newBalance.toFixed(2)
        ]
      );

      await connection.commit();

      return {
        success: true,
        message: '充值成功',
        data: {
          orderNo,
          amount: order.amount,
          balanceBefore: currentBalance.toFixed(2),
          balanceAfter: newBalance.toFixed(2)
        }
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = RechargeOrder;
