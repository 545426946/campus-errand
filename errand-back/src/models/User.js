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
      'SELECT id, username, email, role, nickname, avatar, phone, student_id, major, grade, balance, frozen_balance, total_income, total_expense, certification_status, real_name, id_card, is_certified, certification_type, created_at FROM users WHERE id = ?',
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

  static async findByOpenid(openid) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );
    return rows[0];
  }

  static async findByUnionid(unionid) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE unionid = ?',
      [unionid]
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
      values.push(avatar === '' ? null : avatar);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone === '' ? null : phone);
    }
    if (student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(student_id === '' ? null : student_id);
    }
    if (major !== undefined) {
      fields.push('major = ?');
      values.push(major === '' ? null : major);
    }
    if (grade !== undefined) {
      fields.push('grade = ?');
      values.push(grade === '' ? null : grade);
    }
    if (nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(nickname === '' ? null : nickname);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      // 空字符串转换为 NULL，避免唯一索引冲突
      values.push(email === '' ? null : email);
    }
    if (gender !== undefined) {
      // 处理 gender 字段：数据库使用 ENUM('male','female','other')
      let genderValue = gender;
      if (typeof gender === 'string') {
        // 确保值是有效的 ENUM 值
        const validGenders = ['male', 'female', 'other'];
        genderValue = validGenders.includes(gender.toLowerCase()) ? gender.toLowerCase() : 'other';
      } else if (typeof gender === 'number') {
        // 如果传入数字，转换为字符串
        const genderMap = { 1: 'male', 2: 'female', 0: 'other' };
        genderValue = genderMap[gender] || 'other';
      }
      fields.push('gender = ?');
      values.push(genderValue);
    }
    if (school !== undefined) {
      fields.push('school = ?');
      values.push(school === '' ? null : school);
    }
    if (bio !== undefined) {
      fields.push('bio = ?');
      values.push(bio === '' ? null : bio);
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

  static async createWechatUser(userData) {
    const { openid, unionid, session_key, nickname, avatar, phone } = userData;
    const timestamp = Date.now();
    const username = `wx_${timestamp}`;
    const finalNickname = nickname || '微信用户';
    
    const [result] = await db.execute(
      'INSERT INTO users (openid, unionid, session_key, nickname, avatar, phone, role, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [openid, unionid || null, session_key || null, finalNickname, avatar || '', phone || null, 'student', username, '']
    );
    
    return {
      id: result.insertId,
      openid,
      unionid,
      nickname: finalNickname,
      avatar,
      phone,
      username
    };
  }

  static async updateWechatInfo(id, wechatData) {
    const { session_key, nickname, avatar, phone } = wechatData;
    const fields = [];
    const values = [];

    if (session_key !== undefined) {
      fields.push('session_key = ?');
      values.push(session_key);
    }
    if (nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(avatar);
    }
    if (phone !== undefined) {
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
