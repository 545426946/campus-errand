const db = require('../config/database');

class Certification {
  // 创建认证申请（骑手认证）
  static async create(certificationData) {
    const {
      user_id,
      type = 'rider',
      real_name,
      id_card,
      phone,
      emergency_contact,
      emergency_phone,
      id_card_front,
      id_card_back,
      health_cert
    } = certificationData;

    const query = `
      INSERT INTO certifications (
        user_id, type, real_name, id_card, phone,
        emergency_contact, emergency_phone,
        id_card_front, id_card_back, health_cert,
        status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const [result] = await db.execute(query, [
      user_id,
      type,
      real_name,
      id_card,
      phone || null,
      emergency_contact || null,
      emergency_phone || null,
      id_card_front || null,
      id_card_back || null,
      health_cert || null
    ]);

    return result.insertId;
  }

  // 根据用户ID查找认证记录
  static async findByUserId(userId) {
    const query = `
      SELECT * FROM certifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows[0];
  }

  // 根据ID查找认证记录
  static async findById(id) {
    const query = 'SELECT * FROM certifications WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // 获取待审核的认证列表
  static async getPendingList(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT c.*, u.username, u.nickname, u.avatar 
      FROM certifications c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'pending'
      ORDER BY c.submitted_at ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.execute(query, [pageSize, offset]);

    const countQuery = `SELECT COUNT(*) as total FROM certifications WHERE status = 'pending'`;
    const [countResult] = await db.execute(countQuery);

    return {
      list: rows,
      total: countResult[0].total
    };
  }

  // 审核认证
  static async review(id, reviewData) {
    const { status, reject_reason, reviewer_id } = reviewData;

    const query = `
      UPDATE certifications 
      SET status = ?, reject_reason = ?, reviewer_id = ?, reviewed_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [status, reject_reason || null, reviewer_id, id]);

    // 如果审核通过，更新用户表
    if (status === 'approved') {
      const cert = await this.findById(id);
      await db.execute(
        `UPDATE users 
         SET is_certified = TRUE, 
             certification_type = 'rider', 
             certification_id = ?,
             real_name = ?
         WHERE id = ?`,
        [id, cert.real_name, cert.user_id]
      );
    }

    return await this.findById(id);
  }

  // 获取用户的所有认证记录
  static async getHistoryByUserId(userId) {
    const query = `
      SELECT * FROM certifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  // 检查用户是否已认证
  static async isUserCertified(userId) {
    const query = `
      SELECT is_certified, certification_type 
      FROM users 
      WHERE id = ?
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows[0];
  }

  // 获取统计信息
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM certifications
    `;
    const [rows] = await db.execute(query);
    return rows[0];
  }
}

module.exports = Certification;
