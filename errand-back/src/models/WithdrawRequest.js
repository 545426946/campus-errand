const db = require('../config/database');

/**
 * 提现申请模型
 */
class WithdrawRequest {
  /**
   * 创建提现申请
   */
  static async create(withdrawData) {
    const {
      user_id,
      amount,
      account,
      account_type = 'wechat',
      real_name,
      status = 'pending'
    } = withdrawData;

    try {
      const [result] = await db.execute(
        `INSERT INTO withdraw_requests 
         (user_id, amount, account, account_type, real_name, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, amount, account, account_type, real_name, status]
      );

      return { id: result.insertId, ...withdrawData };
    } catch (error) {
      // 如果表不存在，自动创建
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
        console.log('⚠️ withdraw_requests 表不存在，正在自动创建...');
        await this.createTable();
        console.log('✅ withdraw_requests 表创建成功');
        
        // 重新执行插入
        return this.create(withdrawData);
      }
      throw error;
    }
  }

  /**
   * 自动创建表
   */
  static async createTable() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS withdraw_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL COMMENT '提现金额',
        account VARCHAR(100) NOT NULL COMMENT '提现账户',
        account_type ENUM('wechat', 'alipay', 'bank') DEFAULT 'wechat' COMMENT '账户类型',
        real_name VARCHAR(50) COMMENT '真实姓名',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '状态',
        reject_reason TEXT COMMENT '拒绝原因',
        reviewer_id INT COMMENT '审核人ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现申请表';
    `);
  }

  /**
   * 根据ID查找提现申请
   */
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT wr.*, u.username, u.nickname, u.phone 
       FROM withdraw_requests wr
       LEFT JOIN users u ON wr.user_id = u.id
       WHERE wr.id = ?`,
      [id]
    );
    return rows[0];
  }

  /**
   * 获取用户的提现申请列表
   */
  static async findByUserId(userId, options = {}) {
    const { page = 1, pageSize = 20, status } = options;
    const offset = (page - 1) * pageSize;
    const limitValue = parseInt(pageSize);
    const offsetValue = parseInt(offset);

    try {
      let whereClause = 'WHERE user_id = ?';
      let params = [userId];

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      // 获取总数
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM withdraw_requests ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // 获取记录 - 使用字符串拼接 LIMIT/OFFSET
      const [rows] = await db.execute(
        `SELECT * FROM withdraw_requests 
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
        console.log('⚠️ withdraw_requests 表不存在，正在自动创建...');
        await this.createTable();
        console.log('✅ withdraw_requests 表创建成功');
        
        // 重新执行查询
        return this.findByUserId(userId, options);
      }
      throw error;
    }
  }

  /**
   * 获取所有提现申请（管理员）
   */
  static async findAll(options = {}) {
    const { page = 1, pageSize = 20, status } = options;
    const offset = (page - 1) * pageSize;
    const limitValue = parseInt(pageSize);
    const offsetValue = parseInt(offset);

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE wr.status = ?';
      params.push(status);
    }

    // 获取总数
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM withdraw_requests wr ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取记录 - 使用字符串拼接 LIMIT/OFFSET
    const [rows] = await db.execute(
      `SELECT wr.*, u.username, u.nickname, u.phone, u.balance
       FROM withdraw_requests wr
       LEFT JOIN users u ON wr.user_id = u.id
       ${whereClause} 
       ORDER BY wr.created_at DESC 
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
  }

  /**
   * 更新提现申请状态
   */
  static async updateStatus(id, status, adminNote = null) {
    const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (status === 'completed') {
      fields.push('completed_at = CURRENT_TIMESTAMP');
    }

    if (adminNote) {
      fields.push('admin_note = ?');
      params.push(adminNote);
    }

    params.push(id);

    await db.execute(
      `UPDATE withdraw_requests SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return await this.findById(id);
  }

  /**
   * 审核提现申请
   */
  static async approve(id, adminId, adminNote = null) {
    await db.execute(
      `UPDATE withdraw_requests 
       SET status = 'approved', admin_id = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [adminId, adminNote, id]
    );

    return await this.findById(id);
  }

  /**
   * 拒绝提现申请
   */
  static async reject(id, adminId, reason) {
    await db.execute(
      `UPDATE withdraw_requests 
       SET status = 'rejected', admin_id = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [adminId, reason, id]
    );

    return await this.findById(id);
  }

  /**
   * 获取提现统计
   */
  static async getStats(userId = null) {
    let whereClause = '';
    let params = [];

    if (userId) {
      whereClause = 'WHERE user_id = ?';
      params.push(userId);
    }

    const [rows] = await db.execute(
      `SELECT 
         COUNT(*) as total_count,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
         SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
       FROM withdraw_requests ${whereClause}`,
      params
    );

    return rows[0];
  }
}

module.exports = WithdrawRequest;
