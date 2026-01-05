const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  // 创建管理员
  static async create(adminData) {
    const { username, password, name, email, role = 'admin' } = adminData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await db.execute(
      'INSERT INTO admins (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, email, role]
    );
    
    return { id: result.insertId, username, name, email, role };
  }

  // 根据ID查找管理员
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, name, email, role, status, last_login, created_at FROM admins WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 根据用户名查找管理员
  static async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  // 验证密码
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  // 更新最后登录时间
  static async updateLastLogin(id) {
    await db.execute(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
      [id]
    );
  }

  // 获取所有管理员列表
  static async getAll(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const [rows] = await db.execute(
      `SELECT id, username, name, email, role, status, last_login, created_at 
       FROM admins 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM admins');
    
    return {
      list: rows,
      total: countResult[0].total,
      page,
      pageSize
    };
  }

  // 更新管理员信息
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    const allowedFields = ['name', 'email', 'role', 'status'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });

    if (updateData.password) {
      fields.push('password = ?');
      values.push(await bcrypt.hash(updateData.password, 12));
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await db.execute(
      `UPDATE admins SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  // 删除管理员
  static async delete(id) {
    const [result] = await db.execute('DELETE FROM admins WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Admin;
