const db = require('../config/database');

class Course {
  static async create(courseData) {
    const { title, description, instructor_id, category, difficulty = 'beginner' } = courseData;
    
    const [result] = await db.execute(
      'INSERT INTO courses (title, description, instructor_id, category, difficulty) VALUES (?, ?, ?, ?, ?)',
      [title, description, instructor_id, category, difficulty]
    );
    
    return await this.findById(result.insertId);
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT c.*, u.username as instructor_name, u.email as instructor_email,
      (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as enrolled_count
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.category) {
      query += ' AND c.category = ?';
      params.push(filters.category);
    }
    if (filters.difficulty) {
      query += ' AND c.difficulty = ?';
      params.push(filters.difficulty);
    }
    if (filters.search) {
      query += ' AND c.title LIKE ?';
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT c.*, u.username as instructor_name, u.email as instructor_email
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (rows.length === 0) return null;

    const course = rows[0];
    
    // 获取课程内容
    const [contents] = await db.execute(
      'SELECT * FROM course_contents WHERE course_id = ? ORDER BY content_order',
      [id]
    );
    course.contents = contents;

    // 获取标签
    const [tags] = await db.execute(
      'SELECT tag_name FROM course_tags WHERE course_id = ?',
      [id]
    );
    course.tags = tags.map(t => t.tag_name);

    return course;
  }

  static async update(id, courseData) {
    const { title, description, category, difficulty } = courseData;
    await db.execute(
      'UPDATE courses SET title = ?, description = ?, category = ?, difficulty = ? WHERE id = ?',
      [title, description, category, difficulty, id]
    );
    return await this.findById(id);
  }

  static async enroll(courseId, studentId) {
    await db.execute(
      'INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)',
      [courseId, studentId]
    );
  }

  static async getEnrolledStudents(courseId) {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.email, ce.progress, ce.enrolled_at
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.course_id = ?`,
      [courseId]
    );
    return rows;
  }
}

module.exports = Course;
