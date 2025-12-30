const db = require('../config/database');
class CancelRequest {
  static async create(requestData) {
    const { order_id, requester_id, reason } = requestData;
    const [result] = await db.execute('INSERT INTO cancel_requests (order_id, requester_id, reason, status, created_at) VALUES (?, ?, ?, ?, NOW())', [order_id, requester_id, reason, 'pending']);
    await db.execute('UPDATE orders SET cancel_request_id = ? WHERE id = ?', [result.insertId, order_id]);
    return result.insertId;
  }
  static async findByOrderId(orderId) {
    const [rows] = await db.execute('SELECT cr.*, u.nickname as requester_name FROM cancel_requests cr LEFT JOIN users u ON cr.requester_id = u.id WHERE cr.order_id = ? ORDER BY cr.created_at DESC LIMIT 1', [orderId]);
    return rows.length > 0 ? rows[0] : null;
  }
  static async agree(id) {
    const [result] = await db.execute('UPDATE cancel_requests SET status = ? WHERE id = ?', ['agreed', id]);
    return result.affectedRows > 0;
  }
  static async reject(id) {
    const [result] = await db.execute('UPDATE cancel_requests SET status = ? WHERE id = ?', ['rejected', id]);
    return result.affectedRows > 0;
  }
}
module.exports = CancelRequest;
