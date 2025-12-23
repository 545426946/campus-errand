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
      'SELECT id, username, email, role, avatar, phone, student_id, major, grade, balance, frozen_balance, total_income, total_expense, certification_status, real_name, id_card, created_at FROM users WHERE id = ?',
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

  static async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updateProfile(id, profileData) {
    const { 
      avatar, 
      phone, 
      student_id, 
      major, 
      grade,
      nickname,
      email,
      gender,
      school,
      bio
    } = profileData;
    
    // 构建动态更新语句
    const fields = [];
    const values = [];
    
    if (avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(avatar);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(student_id);
    }
    if (major !== undefined) {
      fields.push('major = ?');
      values.push(major);
    }
    if (grade !== undefined) {
      fields.push('grade = ?');
      values.push(grade);
    }
    if (nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(nickname);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email);
    }
    if (gender !== undefined) {
      fields.push('gender = ?');
      values.push(gender);
    }
    if (school !== undefined) {
      fields.push('school = ?');
      values.push(school);
    }
    if (bio !== undefined) {
      fields.push('bio = ?');
      values.push(bio);
    }
    
    if (fields.length > 0) {
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      await db.execute(query, values);
    }
    
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
      'SELECT id, username, nickname, avatar, phone, openid FROM users WHERE openid LIKE ? OR username LIKE ? LIMIT 1',
      [`%${code}%`, `%${code}%`]
    );
    
    return rows[0];
  }

  static async createWechatUser(userData) {
    const { openid, nickname, avatar, username } = userData;
    const timestamp = Date.now();
    const finalUsername = username || `wx_user_${timestamp}`;
    const finalNickname = nickname || '微信用户';
    
    const [result] = await db.execute(
      'INSERT INTO users (openid, nickname, avatar, role, username, password) VALUES (?, ?, ?, ?, ?, ?)',
      [openid, finalNickname, avatar, 'student', finalUsername, '']
    );
    
    return {
      id: result.insertId,
      openid,
      nickname: finalNickname,
      avatar,
      phone: null,
      username: finalUsername
    };
  }

  static async updateUserInfo(id, userData) {
    const fields = [];
    const values = [];

    // 支持更多字段
    const allowedFields = ['nickname', 'avatar', 'phone', 'real_name', 'id_card', 'certification_status', 'balance', 'frozen_balance'];
    
    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(userData[field]);
      }
    });

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
