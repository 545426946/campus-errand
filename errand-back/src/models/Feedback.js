const db = require('../config/database');

class Feedback {
  // 创建反馈
  static async create(feedbackData) {
    const { user_id, type, title, content, contact, images } = feedbackData;

    const query = `
      INSERT INTO feedbacks (user_id, type, title, content, contact, images, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await db.execute(query, [
      user_id,
      type || 'other',
      title,
      content,
      contact || null,
      images ? JSON.stringify(images) : null
    ]);

    return result.insertId;
  }

  // 获取用户的反馈列表
  static async getByUserId(userId, page = 1, pageSize = 20) {
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 20;
    const offset = (pageNum - 1) * pageSizeNum;

    const query = `
      SELECT * FROM feedbacks 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${pageSizeNum} OFFSET ${offset}
    `;
    const [rows] = await db.execute(query, [userId]);

    const countQuery = `SELECT COUNT(*) as total FROM feedbacks WHERE user_id = ?`;
    const [countResult] = await db.execute(countQuery, [userId]);

    return {
      list: rows.map(row => ({
        ...row,
        images: row.images ? JSON.parse(row.images) : []
      })),
      total: countResult[0].total
    };
  }

  // 获取所有反馈列表（管理员）
  static async getAll(page = 1, pageSize = 20, filters = {}) {
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 20;
    const offset = (pageNum - 1) * pageSizeNum;
    let whereClause = '1=1';
    const params = [];

    if (filters.status && filters.status.trim()) {
      whereClause += ' AND f.status = ?';
      params.push(filters.status);
    }

    if (filters.type && filters.type.trim()) {
      whereClause += ' AND f.type = ?';
      params.push(filters.type);
    }

    if (filters.keyword && filters.keyword.trim()) {
      whereClause += ' AND (f.title LIKE ? OR f.content LIKE ?)';
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    // 使用字符串拼接 LIMIT 和 OFFSET，避免参数化查询问题
    const query = `
      SELECT f.*, u.nickname, u.username, u.avatar
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE ${whereClause}
      ORDER BY 
        CASE f.status 
          WHEN 'pending' THEN 1 
          WHEN 'processing' THEN 2 
          ELSE 3 
        END,
        f.created_at DESC
      LIMIT ${pageSizeNum} OFFSET ${offset}
    `;

    const [rows] = await db.execute(query, params);

    const countQuery = `
      SELECT COUNT(*) as total FROM feedbacks f WHERE ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, params);

    return {
      list: rows.map(row => ({
        ...row,
        images: row.images ? JSON.parse(row.images) : []
      })),
      total: countResult[0].total
    };
  }

  // 根据ID获取反馈
  static async findById(id) {
    const query = `
      SELECT f.*, u.nickname, u.username, u.avatar
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    
    if (rows[0]) {
      rows[0].images = rows[0].images ? JSON.parse(rows[0].images) : [];
    }
    
    return rows[0];
  }

  // 回复反馈
  static async reply(id, replyData) {
    const { reply, status, replied_by } = replyData;

    const query = `
      UPDATE feedbacks 
      SET reply = ?, status = ?, replied_by = ?, replied_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [reply, status || 'resolved', replied_by, id]);
    return this.findById(id);
  }

  // 更新状态
  static async updateStatus(id, status) {
    const query = `UPDATE feedbacks SET status = ? WHERE id = ?`;
    await db.execute(query, [status, id]);
    return this.findById(id);
  }

  // 获取统计信息
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM feedbacks
    `;
    const [rows] = await db.execute(query);
    return rows[0];
  }
}

module.exports = Feedback;
