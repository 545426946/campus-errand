const db = require('../config/database');

class Notification {
  // 创建通知
  static async create(notificationData) {
    const { userId, orderId, type, title, content } = notificationData;

    const query = `
      INSERT INTO notifications (
        user_id, order_id, type, title, content, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, false, NOW())
    `;

    const [result] = await db.execute(query, [
      userId,
      orderId,
      type,
      title,
      content
    ]);

    return result.insertId;
  }

  // 获取用户的通知列表
  static async findByUser(userId, options = {}) {
    let query = `
      SELECT n.*, o.title as order_title
      FROM notifications n
      LEFT JOIN orders o ON n.order_id = o.id
      WHERE n.user_id = ?
    `;
    const params = [userId];

    if (options.unreadOnly) {
      query += ' AND n.is_read = false';
    }

    query += ' ORDER BY n.created_at DESC';

    if (options.pageSize && options.page) {
      const pageSize = parseInt(options.pageSize);
      const offset = (parseInt(options.page) - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // 根据ID获取通知
  static async findById(notificationId) {
    const query = 'SELECT * FROM notifications WHERE id = ?';
    const [rows] = await db.execute(query, [notificationId]);
    return rows[0];
  }

  // 标记为已读
  static async markAsRead(notificationId) {
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [notificationId]);
    return result.affectedRows > 0;
  }

  // 标记所有为已读
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE user_id = ? AND is_read = false
    `;
    const [result] = await db.execute(query, [userId]);
    return result.affectedRows;
  }

  // 获取未读数量
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = false
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows[0].count;
  }

  // 删除通知
  static async delete(notificationId) {
    const query = 'DELETE FROM notifications WHERE id = ?';
    const [result] = await db.execute(query, [notificationId]);
    return result.affectedRows > 0;
  }

  // 创建订单相关通知
  static async createOrderNotification(orderId, userId, type, title, content) {
    return await this.create({
      userId,
      orderId,
      type,
      title,
      content
    });
  }
}

module.exports = Notification;
