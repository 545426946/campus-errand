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
      SELECT o.*, u.nickname as publisher_name, u.username as publisher_username, u.avatar as publisher_avatar
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
    console.log('=== 强制调试：查询订单详情，ID:', orderId, '===');
    
    const query = `
      SELECT o.*, 
        u.nickname as publisher_name, u.username as publisher_username, u.avatar as publisher_avatar,
        u.phone as publisher_phone,
        a.nickname as acceptor_name, a.username as acceptor_username, a.avatar as acceptor_avatar,
        a.phone as acceptor_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.acceptor_id = a.id
      WHERE o.id = ?
    `;

    const [rows] = await db.execute(query, [orderId]);
    
    if (rows.length === 0) {
      console.log('订单不存在');
      return null;
    }

    const order = rows[0];
    order.images = safeJSONParse(order.images);
    
    // 强制查询接单者信息，确保有数据
    if (order.acceptor_id) {
      console.log('强制查询接单者信息，ID:', order.acceptor_id);
      try {
        const [acceptorRows] = await db.execute(
          'SELECT username, nickname, avatar, phone FROM users WHERE id = ?',
          [order.acceptor_id]
        );
        
        console.log('接单者查询结果:', acceptorRows);
        
        if (acceptorRows.length > 0) {
          const acceptor = acceptorRows[0];
          order.acceptor_name = acceptor.nickname;
          order.acceptor_username = acceptor.username;
          order.acceptor_avatar = acceptor.avatar;
          order.acceptor_phone = acceptor.phone;
          
          console.log('设置接单者信息成功:', {
            acceptor_name: order.acceptor_name,
            acceptor_username: order.acceptor_username
          });
        } else {
          console.log('未找到接单者信息，ID:', order.acceptor_id);
        }
      } catch (error) {
        console.error('强制查询接单者信息失败:', error);
      }
    }
    
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
    console.log('=== Order.accept 调试 ===');
    console.log('订单ID:', orderId);
    console.log('接单者ID:', acceptorId);
    
    const query = `
      UPDATE orders 
      SET acceptor_id = ?, status = 'accepted', accepted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND status = 'pending'
    `;

    const [result] = await db.execute(query, [acceptorId, orderId]);
    const success = result.affectedRows > 0;
    
    console.log('更新结果:', { affectedRows: result.affectedRows, success });
    
    if (success) {
      // 验证更新是否成功
      const [verifyRows] = await db.execute(
        'SELECT acceptor_id, status FROM orders WHERE id = ?',
        [orderId]
      );
      console.log('验证更新结果:', verifyRows[0]);
    }
    
    return success;
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

  // 接单者标记完成（进入待确认状态）
  static async markCompleting(orderId) {
    const query = `
      UPDATE orders 
      SET status = 'completing', updated_at = NOW()
      WHERE id = ? AND status = 'accepted'
    `;

    const [result] = await db.execute(query, [orderId]);
    return result.affectedRows > 0;
  }

  // 发布者确认完成
  static async confirmComplete(orderId) {
    const query = `
      UPDATE orders 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = ? AND status = 'completing'
    `;

    const [result] = await db.execute(query, [orderId]);
    return result.affectedRows > 0;
  }

  // 完成订单（保留旧方法兼容性）
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
    console.log('=== Order.findByPublisher 调试 ===');
    console.log('查询用户ID:', userId, '类型:', typeof userId);
    console.log('过滤条件:', filters);
    
    let query = `
      SELECT o.*, 
        u.nickname as publisher_name, u.username as publisher_username, u.avatar as publisher_avatar,
        a.nickname as acceptor_name, a.username as acceptor_username, a.avatar as acceptor_avatar
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.acceptor_id = a.id
      WHERE o.user_id = ?
    `;
    const params = [userId];

    if (filters.status && filters.status !== 'undefined') {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY o.created_at DESC';

    if (filters.pageSize && filters.page) {
      const pageSize = parseInt(filters.pageSize);
      const offset = (parseInt(filters.page) - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    console.log('执行SQL:', query);
    console.log('SQL参数:', params);

    const [rows] = await db.execute(query, params);
    
    console.log('SQL返回行数:', rows.length);
    if (rows.length > 0) {
      console.log('第一条数据:', rows[0]);
    }
    
    return rows.map(row => ({
      ...row,
      images: safeJSONParse(row.images)
    }));
  }

  // 获取用户接受的订单
  static async findByAcceptor(acceptorId, filters = {}) {
    console.log('=== Order.findByAcceptor 调试 ===');
    console.log('查询接单者ID:', acceptorId, '类型:', typeof acceptorId);
    console.log('过滤条件:', filters);
    
    let query = `
      SELECT o.*, 
        u.nickname as publisher_name, u.username as publisher_username, u.avatar as publisher_avatar,
        a.nickname as acceptor_name, a.username as acceptor_username, a.avatar as acceptor_avatar
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.acceptor_id = a.id
      WHERE o.acceptor_id = ?
    `;
    const params = [acceptorId];

    if (filters.status && filters.status !== 'undefined') {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY o.created_at DESC';

    if (filters.pageSize && filters.page) {
      const pageSize = parseInt(filters.pageSize);
      const offset = (parseInt(filters.page) - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    console.log('执行SQL:', query);
    console.log('SQL参数:', params);

    const [rows] = await db.execute(query, params);
    
    console.log('SQL返回行数:', rows.length);
    if (rows.length > 0) {
      console.log('第一条数据:', rows[0]);
    }
    
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
