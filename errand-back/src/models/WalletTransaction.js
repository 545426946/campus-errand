const db = require('../config/database');

class WalletTransaction {
  // 创建交易记录
  static async create(transactionData) {
    const {
      user_id,
      type,
      amount,
      balance_before,
      balance_after,
      title,
      description,
      order_id,
      status = 'completed'
    } = transactionData;

    const [result] = await db.execute(
      `INSERT INTO wallet_transactions 
       (user_id, type, amount, balance_before, balance_after, title, description, order_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, type, amount, balance_before, balance_after, title, description, order_id, status]
    );

    return { id: result.insertId, ...transactionData };
  }

  // 获取用户交易记录
  static async getUserTransactions(userId, options = {}) {
    const { page = 1, pageSize = 20, type } = options;
    const offset = (page - 1) * pageSize;

    try {
      let whereClause = 'WHERE user_id = ?';
      let params = [userId];

      if (type && type !== 'undefined') {
        whereClause += ' AND type = ?';
        params.push(type);
      }

      // 获取总数
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // 获取记录 - 使用字符串拼接而不是参数绑定 LIMIT/OFFSET
      const limitValue = parseInt(pageSize);
      const offsetValue = parseInt(offset);

      console.log('=== 钱包明细查询参数 ===');
      console.log('userId:', userId);
      console.log('type:', type);
      console.log('limitValue:', limitValue);
      console.log('offsetValue:', offsetValue);

      // 获取记录
      const [rows] = await db.execute(
        `SELECT * FROM wallet_transactions 
         ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ${limitValue} OFFSET ${offsetValue}`,
        params
      );

      return {
        list: rows,
        total,
        page,
        pageSize,
        hasMore: offset + rows.length < total
      };
    } catch (error) {
      // 如果表不存在，自动创建
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
        console.log('⚠️ wallet_transactions 表不存在，正在自动创建...');
        await this.createTable();
        console.log('✅ wallet_transactions 表创建成功');
        
        // 重新执行查询
        return this.getUserTransactions(userId, options);
      }
      throw error;
    }
  }

  // 自动创建表
  static async createTable() {
    await db.execute(`
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
        INDEX idx_related (related_type, related_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包交易记录表';
    `);
  }

  // 获取用户余额统计
  static async getUserBalanceStats(userId) {
    const [rows] = await db.execute(
      `SELECT 
         SUM(CASE WHEN type IN ('recharge', 'income') THEN amount ELSE 0 END) as total_income,
         SUM(CASE WHEN type IN ('withdraw', 'expense') THEN amount ELSE 0 END) as total_expense,
         SUM(CASE WHEN type IN ('recharge', 'income') AND DATE(created_at) = CURDATE() THEN amount ELSE 0 END) as today_income
       FROM wallet_transactions 
       WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );

    return rows[0] || {
      total_income: 0,
      total_expense: 0,
      today_income: 0
    };
  }

  // 更新用户余额（事务安全）
  static async updateUserBalance(userId, amount, type, transactionData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // 获取当前余额
      const [userRows] = await connection.execute(
        'SELECT balance, frozen_balance FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (userRows.length === 0) {
        throw new Error('用户不存在');
      }

      const currentBalance = parseFloat(userRows[0].balance) || 0;
      const frozenBalance = parseFloat(userRows[0].frozen_balance) || 0;
      let newBalance = currentBalance;
      let newFrozenBalance = frozenBalance;

      // 根据交易类型计算新余额
      switch (type) {
        case 'recharge':
        case 'income':
        case 'unfreeze':
          newBalance = currentBalance + parseFloat(amount);
          break;
        case 'withdraw':
        case 'expense':
          if (currentBalance < parseFloat(amount)) {
            throw new Error('余额不足');
          }
          newBalance = currentBalance - parseFloat(amount);
          break;
        case 'freeze':
          if (currentBalance < parseFloat(amount)) {
            throw new Error('余额不足');
          }
          newBalance = currentBalance - parseFloat(amount);
          newFrozenBalance = frozenBalance + parseFloat(amount);
          break;
      }

      // 更新用户余额
      await connection.execute(
        'UPDATE users SET balance = ?, frozen_balance = ? WHERE id = ?',
        [newBalance, newFrozenBalance, userId]
      );

      // 创建交易记录
      const [transactionResult] = await connection.execute(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, balance_before, balance_after, title, description, order_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          type,
          amount,
          currentBalance,
          newBalance,
          transactionData.title,
          transactionData.description || '',
          transactionData.order_id || null,
          transactionData.status || 'completed'
        ]
      );

      await connection.commit();

      return {
        id: transactionResult.insertId,
        balance_before: currentBalance,
        balance_after: newBalance,
        frozen_balance: newFrozenBalance
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID查找交易记录
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM wallet_transactions WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 更新交易状态
  static async updateStatus(id, status) {
    await db.execute(
      'UPDATE wallet_transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    return await this.findById(id);
  }
}

module.exports = WalletTransaction;