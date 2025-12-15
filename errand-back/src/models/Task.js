const { pool } = require('../config/database');

class Task {
  static async create(taskData) {
    const {
      title, description, task_type, course_id, creator_id,
      status = 'pending', priority = 'medium', due_date, assigned_to = []
    } = taskData;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.execute(
        `INSERT INTO tasks (title, description, task_type, course_id, creator_id, status, priority, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, task_type, course_id, creator_id, status, priority, due_date]
      );
      
      const taskId = result.insertId;
      
      // 分配任务给用户
      if (assigned_to.length > 0) {
        const values = assigned_to.map(userId => [taskId, userId]);
        await connection.query(
          'INSERT INTO task_assignments (task_id, user_id) VALUES ?',
          [values]
        );
      }
      
      await connection.commit();
      return await this.findById(taskId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT t.*, u.username as creator_name, c.title as course_title
      FROM tasks t
      JOIN users u ON t.creator_id = u.id
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.type) {
      query += ' AND t.task_type = ?';
      params.push(filters.type);
    }
    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }
    if (filters.priority) {
      query += ' AND t.priority = ?';
      params.push(filters.priority);
    }
    if (filters.userId && filters.userRole === 'student') {
      query += ' AND t.id IN (SELECT task_id FROM task_assignments WHERE user_id = ?)';
      params.push(filters.userId);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT t.*, u.username as creator_name, u.email as creator_email, c.title as course_title
       FROM tasks t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN courses c ON t.course_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    
    if (rows.length === 0) return null;

    const task = rows[0];
    
    // 获取分配的用户
    const [assigned] = await pool.execute(
      `SELECT u.id, u.username, u.email FROM task_assignments ta
       JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = ?`,
      [id]
    );
    task.assigned_to = assigned;

    // 获取提交记录
    const [submissions] = await pool.execute(
      `SELECT ts.*, u.username FROM task_submissions ts
       JOIN users u ON ts.user_id = u.id
       WHERE ts.task_id = ?`,
      [id]
    );
    task.submissions = submissions;

    return task;
  }

  static async submit(taskId, userId, submissionData) {
    const { content, files = [] } = submissionData;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.execute(
        'INSERT INTO task_submissions (task_id, user_id, content) VALUES (?, ?, ?)',
        [taskId, userId, content]
      );
      
      const submissionId = result.insertId;
      
      // 保存文件信息
      if (files.length > 0) {
        const values = files.map(file => [submissionId, file.name, file.path, file.size]);
        await connection.query(
          'INSERT INTO submission_files (submission_id, file_name, file_path, file_size) VALUES ?',
          [values]
        );
      }
      
      await connection.commit();
      return { id: submissionId, task_id: taskId, user_id: userId, content };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Task;
