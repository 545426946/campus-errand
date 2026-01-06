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

    const [result] = await db.execute(
      `INSERT INTO withdraw_requests 
       (user_id, amount, account, account_type, real_name, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, amount, account, account_type, real_name, status]
    );

    return { id: result.insertId, ...withdrawData };
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

    // 获取记录
    const [rows] = await db.execute(
      `SELECT * FROM withdraw_requests 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
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
   * 获取所有提现申请（管理员）
   */
  static async findAll(options = {}) {
    const { page = 1, pageSize = 20, status } = options;
    const offset = (page - 1) * pageSize;

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

    // 获取记录
    const [rows] = await db.execute(
      `SELECT wr.*, u.username, u.nickname, u.phone, u.balance
       FROM withdraw_requests wr
       LEFT JOIN users u ON wr.user_id = u.id
       ${whereClause} 
       ORDER BY wr.created_at DESC 
       LIMIT ? OFFSET ?`,
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
