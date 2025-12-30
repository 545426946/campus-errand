const db = require('../config/database');

class Message {
  // 创建消息
  static async create(messageData) {
    const { order_id, sender_id, receiver_id, content, type = 'text' } = messageData;
    
    const query = `
      INSERT INTO messages (order_id, sender_id, receiver_id, content, type, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(query, [order_id, sender_id, receiver_id, content, type]);
    return result.insertId;
  }

  // 获取订单的所有消息
  static async getByOrderId(orderId) {
    const query = `
      SELECT 
        m.*,
        sender.nickname as sender_name,
        sender.avatar as sender_avatar,
        receiver.nickname as receiver_name,
        receiver.avatar as receiver_avatar
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.order_id = ?
      ORDER BY m.created_at ASC
    `;
    
    const [rows] = await db.execute(query, [orderId]);
    return rows;
  }

  // 获取用户的聊天列表（按订单分组）
  static async getChatListByUserId(userId) {
    const query = `
      SELECT 
        m.order_id,
        o.title as order_title,
        o.status as order_status,
        MAX(m.created_at) as last_message_time,
        (
          SELECT content 
          FROM messages 
          WHERE order_id = m.order_id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE order_id = m.order_id 
          AND receiver_id = ? 
          AND is_read = 0
        ) as unread_count,
        COUNT(DISTINCT m.id) as message_count,
        CASE 
          WHEN o.user_id = ? THEN o.acceptor_id
          ELSE o.user_id
        END as other_user_id,
        CASE 
          WHEN o.user_id = ? THEN acceptor.nickname
          ELSE publisher.nickname
        END as other_user_name,
        CASE 
          WHEN o.user_id = ? THEN acceptor.avatar
          ELSE publisher.avatar
        END as other_user_avatar
      FROM messages m
      INNER JOIN orders o ON m.order_id = o.id
      LEFT JOIN users publisher ON o.user_id = publisher.id
      LEFT JOIN users acceptor ON o.acceptor_id = acceptor.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY m.order_id
      ORDER BY last_message_time DESC
    `;
    
    const [rows] = await db.execute(query, [userId, userId, userId, userId, userId, userId]);
    return rows;
  }

  // 获取未读消息数
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND is_read = 0
    `;
    
    const [rows] = await db.execute(query, [userId]);
    return rows[0].count;
  }

  // 标记消息为已读
  static async markAsRead(orderId, userId) {
    const query = `
      UPDATE messages
      SET is_read = 1
      WHERE order_id = ? AND receiver_id = ? AND is_read = 0
    `;
    
    await db.execute(query, [orderId, userId]);
  }

  // 删除订单的所有消息
  static async deleteByOrderId(orderId) {
    const query = 'DELETE FROM messages WHERE order_id = ?';
    await db.execute(query, [orderId]);
  }
}

module.exports = Message;
