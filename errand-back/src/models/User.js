const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, role = 'student' } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    
    return { id: result.insertId, username, email, role };
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, email, role, avatar, phone, student_id, major, grade, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updateProfile(id, profileData) {
    const { avatar, phone, student_id, major, grade } = profileData;
    await db.execute(
      'UPDATE users SET avatar = ?, phone = ?, student_id = ?, major = ?, grade = ? WHERE id = ?',
      [avatar, phone, student_id, major, grade, id]
    );
    return await this.findById(id);
  }

  static async getLearningProgress(userId) {
    const [rows] = await db.execute(
      `SELECT ce.course_id, c.title, ce.progress, ce.last_accessed 
       FROM course_enrollments ce 
       JOIN courses c ON ce.course_id = c.id 
       WHERE ce.student_id = ?`,
      [userId]
    );
    return rows;
  }

  static async findByWechatCode(code) {
    // 简化版：通过openid查找用户
    const [rows] = await db.execute(
      'SELECT id, nickname, avatar, phone, openid FROM users WHERE openid LIKE ? LIMIT 1',
      [`%${code}%`]
    );
    return rows[0];
  }

  static async createWechatUser(userData) {
    const { openid, nickname, avatar, username } = userData;
    
    const [result] = await db.execute(
      'INSERT INTO users (openid, nickname, avatar, role, username, password) VALUES (?, ?, ?, ?, ?, ?)',
      [openid, nickname, avatar, 'student', username || `wx_user_${Date.now()}`, '']
    );
    
    return {
      id: result.insertId,
      openid,
      nickname,
      avatar,
      phone: null,
      username: username || `wx_user_${Date.now()}`
    };
  }

  static async updateUserInfo(id, userData) {
    const { nickname, avatar, phone } = userData;
    const fields = [];
    const values = [];

    if (nickname) {
      fields.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar) {
      fields.push('avatar = ?');
      values.push(avatar);
    }
    if (phone) {
      fields.push('phone = ?');
      values.push(phone);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await db.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }
}

module.exports = User;
