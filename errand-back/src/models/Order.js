const db = require('../config/database');

// 安全解析JSON
const safeJSONParse = (str) => {
  if (!str || str === '' || str === 'null') return [];
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON parse error:', e, 'Input:', str);
    return [];
  }
};

class Order {
  // 创建订单
  static async create(orderData) {
    const {
      userId,
      title,
      description,
      type,
      price,
      pickupLocation,
      deliveryLocation,
      contactPhone,
      images
    } = orderData;

    const query = `
      INSERT INTO orders (
        user_id, title, description, type, price,
        pickup_location, delivery_location, contact_phone,
        images, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const [result] = await db.execute(query, [
      userId,
      title,
      description,
      type,
      price,
      pickupLocation,
      deliveryLocation,
      contactPhone,
      JSON.stringify(images || [])
    ]);

    return result.insertId;
  }

  // 获取订单列表
  static async findAll(filters = {}) {
    let query = `
      SELECT o.*, u.nickname as publisher_name, u.avatar as publisher_avatar
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status && filters.status !== '') {
      // 支持多个状态，用逗号分隔
      const statuses = filters.status.split(',').map(s => s.trim());
      if (statuses.length > 1) {
        query += ` AND o.status IN (${statuses.map(() => '?').join(',')})`;
        params.push(...statuses);
      } else {
        query += ' AND o.status = ?';
        params.push(filters.status);
      }
    }

    if (filters.type && filters.type !== '') {
      query += ' AND o.type = ?';
      params.push(filters.type);
    }

    if (filters.keyword && filters.keyword !== '') {
      query += ' AND (o.title LIKE ? OR o.description LIKE ?)';
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    query += ' ORDER BY o.created_at DESC';

    if (filters.pageSize && filters.page) {
      const pageSize = parseInt(filters.pageSize);
      const offset = (parseInt(filters.page) - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    const [rows] = await db.execute(query, params);
    
    // 解析 images JSON
    return rows.map(row => ({
      ...row,
      images: safeJSONParse(row.images)
    }));
  }

  // 根据ID获取订单
  static async findById(orderId) {
    const query = `
      SELECT o.*, 
        u.nickname as publisher_name, u.avatar as publisher_avatar,
        u.phone as publisher_phone,
        a.nickname as acceptor_name, a.avatar as acceptor_avatar,
        a.phone as acceptor_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.acceptor_id = a.id
      WHERE o.id = ?
    `;

    const [rows] = await db.execute(query, [orderId]);
    
    if (rows.length === 0) {
      return null;
    }

    const order = rows[0];
    order.images = safeJSONParse(order.images);
    
    return order;
  }

  // 更新订单
  static async update(orderId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key === 'images') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    values.push(orderId);

    const query = `UPDATE orders SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await db.execute(query, values);

    return result.affectedRows > 0;
  }

  // 接单
  static async accept(orderId, acceptorId) {
    const query = `
      UPDATE orders 
      SET acceptor_id = ?, status = 'accepted', accepted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND status = 'pending'
    `;

    const [result] = await db.execute(query, [acceptorId, orderId]);
    return result.affectedRows > 0;
  }

  // 取消订单
  static async cancel(orderId, reason) {
    const query = `
      UPDATE orders 
      SET status = 'cancelled', cancel_reason = ?, cancelled_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [reason, orderId]);
    return result.affectedRows > 0;
  }

  // 完成订单
  static async complete(orderId) {
    const query = `
      UPDATE orders 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = ? AND status = 'accepted'
    `;

    const [result] = await db.execute(query, [orderId]);
    return result.affectedRows > 0;
  }

  // 获取用户发布的订单
  static async findByPublisher(userId, filters = {}) {
    let query = `
      SELECT o.*, a.nickname as acceptor_name, a.avatar as acceptor_avatar
      FROM orders o
      LEFT JOIN users a ON o.acceptor_id = a.id
      WHERE o.user_id = ?
    `;
    const params = [userId];

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY o.created_at DESC';

    if (filters.pageSize && filters.page) {
      const pageSize = parseInt(filters.pageSize);
      const offset = (parseInt(filters.page) - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    const [rows] = await db.execute(query, params);
    
    return rows.map(row => ({
      ...row,
      images: safeJSONParse(row.images)
    }));
  }

  // 获取用户接受的订单
  static async findByAcceptor(acceptorId, filters = {}) {
    let query = `
      SELECT o.*, u.nickname as publisher_name, u.avatar as publisher_avatar
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.acceptor_id = ?
    `;
    const params = [acceptorId];

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY o.created_at DESC';

    if (filters.pageSize && filters.page) {
      const pageSize = parseInt(filters.pageSize);
      const offset = (parseInt(filters.page) - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    const [rows] = await db.execute(query, params);
    
    return rows.map(row => ({
      ...row,
      images: safeJSONParse(row.images)
    }));
  }

  // 删除订单
  static async delete(orderId) {
    const query = 'DELETE FROM orders WHERE id = ?';
    const [result] = await db.execute(query, [orderId]);
    return result.affectedRows > 0;
  }

  // 获取订单统计
  static async getStats(userId) {
    const query = `
      SELECT 
        COUNT(CASE WHEN user_id = ? THEN 1 END) as published_count,
        COUNT(CASE WHEN acceptor_id = ? THEN 1 END) as accepted_count,
        COUNT(CASE WHEN user_id = ? AND status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN acceptor_id = ? AND status = 'accepted' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN (user_id = ? OR acceptor_id = ?) AND status = 'completed' THEN 1 END) as completed_count
      FROM orders
    `;

    const [rows] = await db.execute(query, [userId, userId, userId, userId, userId, userId]);
    return rows[0];
  }

  // 搜索订单
  static async search(keyword, filters = {}) {
    let query = `
      SELECT o.*, u.nickname as publisher_name, u.avatar as publisher_avatar
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE (o.title LIKE ? OR o.description LIKE ?)
      AND o.status = 'pending'
    `;
    const params = [`%${keyword}%`, `%${keyword}%`];

    query += ' ORDER BY o.created_at DESC';

    if (filters.pageSize && filters.page) {
      const pageSize = parseInt(filters.pageSize);
      const offset = (parseInt(filters.page) - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    const [rows] = await db.execute(query, params);
    
    return {
      list: rows.map(row => ({
        ...row,
        images: safeJSONParse(row.images)
      })),
      total: rows.length,
      page: filters.page || 1,
      pageSize: filters.pageSize || 10
    };
  }
}

module.exports = Order;
