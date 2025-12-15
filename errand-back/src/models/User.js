const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, role = 'student' } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    
    return { id: result.insertId, username, email, role };
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, avatar, phone, student_id, major, grade, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
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
    await pool.execute(
      'UPDATE users SET avatar = ?, phone = ?, student_id = ?, major = ?, grade = ? WHERE id = ?',
      [avatar, phone, student_id, major, grade, id]
    );
    return await this.findById(id);
  }

  static async getLearningProgress(userId) {
    const [rows] = await pool.execute(
      `SELECT ce.course_id, c.title, ce.progress, ce.last_accessed 
       FROM course_enrollments ce 
       JOIN courses c ON ce.course_id = c.id 
       WHERE ce.student_id = ?`,
      [userId]
    );
    return rows;
  }
}

module.exports = User;
