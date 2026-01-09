const Admin = require('../models/Admin');
const User = require('../models/User');
const Order = require('../models/Order');
const Certification = require('../models/Certification');
const jwt = require('jsonwebtoken');

class AdminController {
  // 管理员登录
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '请提供用户名和密码'
        });
      }

      const admin = await Admin.findByUsername(username);
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      if (admin.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '账号已被禁用'
        });
      }

      const isPasswordValid = await Admin.comparePassword(password, admin.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 更新最后登录时间
      await Admin.updateLastLogin(admin.id);

      // 生成token
      const token = jwt.sign(
        { 
          id: admin.id, 
          username: admin.username,
          role: admin.role,
          type: 'admin'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            name: admin.name,
            email: admin.email,
            role: admin.role
          }
        }
      });
    } catch (error) {
      console.error('管理员登录错误:', error);
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  }

  // 获取当前管理员信息
  static async getCurrentAdmin(req, res) {
    try {
      res.json({
        success: true,
        data: req.admin
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取管理员信息失败',
        error: error.message
      });
    }
  }

  // 获取系统统计数据
  static async getStatistics(req, res) {
    try {
      const db = require('../config/database');

      // 用户统计
      const [userStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN is_certified = 1 THEN 1 ELSE 0 END) as certified_users,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new_users
        FROM users
      `);

      // 订单统计
      const [orderStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_orders,
          SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) as total_amount
        FROM orders
      `);

      // 认证统计
      const certStats = await Certification.getStats();

      res.json({
        success: true,
        data: {
          users: userStats[0],
          orders: orderStats[0],
          certifications: certStats
        }
      });
    } catch (error) {
      console.error('获取统计数据错误:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败',
        error: error.message
      });
    }
  }

  // 获取用户列表
  static async getUsers(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword, certification_status } = req.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 20;
      const offset = (pageNum - 1) * pageSizeNum;
      const db = require('../config/database');

      let whereClause = '1=1';
      const params = [];

      if (keyword && keyword.trim() !== '') {
        whereClause += ' AND (username LIKE ? OR nickname LIKE ? OR phone LIKE ? OR student_id LIKE ?)';
        const searchTerm = `%${keyword}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (certification_status && certification_status.trim() !== '') {
        whereClause += ' AND is_certified = ?';
        params.push(certification_status === 'certified' ? 1 : 0);
      }

      // 使用字符串拼接LIMIT和OFFSET，避免参数问题
      const sql = `SELECT id, username, nickname, avatar, phone, student_id, major, grade, 
                balance, frozen_balance, is_certified, certification_type, created_at
         FROM users 
         WHERE ${whereClause}
         ORDER BY created_at DESC 
         LIMIT ${pageSizeNum} OFFSET ${offset}`;

      const [users] = await db.execute(sql, params);

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          list: users,
          total: countResult[0].total,
          page: pageNum,
          pageSize: pageSizeNum
        }
      });
    } catch (error) {
      console.error('获取用户列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        error: error.message
      });
    }
  }

  // 获取用户详情
  static async getUserDetail(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 获取用户的认证记录
      const certifications = await Certification.getHistoryByUserId(id);

      // 获取用户的订单统计
      const db = require('../config/database');
      const [orderStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
        FROM orders 
        WHERE publisher_id = ? OR receiver_id = ?
      `, [id, id]);

      res.json({
        success: true,
        data: {
          user,
          certifications,
          orderStats: orderStats[0]
        }
      });
    } catch (error) {
      console.error('获取用户详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户详情失败',
        error: error.message
      });
    }
  }

  // 更新用户信息
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await User.updateUserInfo(id, updateData);

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: user
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '更新用户信息失败',
        error: error.message
      });
    }
  }

  // 删除用户
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const db = require('../config/database');

      await db.execute('DELETE FROM users WHERE id = ?', [id]);

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      console.error('删除用户错误:', error);
      res.status(500).json({
        success: false,
        message: '删除用户失败',
        error: error.message
      });
    }
  }

  // 获取订单列表
  static async getOrders(req, res) {
    try {
      const { page = 1, pageSize = 20, status, keyword } = req.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 20;
      const offset = (pageNum - 1) * pageSizeNum;
      const db = require('../config/database');

      let whereClause = '1=1';
      const params = [];

      if (status && status.trim() !== '') {
        whereClause += ' AND o.status = ?';
        params.push(status);
      }

      if (keyword && keyword.trim() !== '') {
        whereClause += ' AND (o.title LIKE ? OR o.description LIKE ?)';
        const searchTerm = `%${keyword}%`;
        params.push(searchTerm, searchTerm);
      }

      const sql = `SELECT o.*, 
                u1.nickname as publisher_name, u1.avatar as publisher_avatar,
                u2.nickname as acceptor_name, u2.avatar as acceptor_avatar
         FROM orders o
         LEFT JOIN users u1 ON o.user_id = u1.id
         LEFT JOIN users u2 ON o.acceptor_id = u2.id
         WHERE ${whereClause}
         ORDER BY o.created_at DESC 
         LIMIT ${pageSizeNum} OFFSET ${offset}`;

      const [orders] = await db.execute(sql, params);

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          list: orders,
          total: countResult[0].total,
          page: pageNum,
          pageSize: pageSizeNum
        }
      });
    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: error.message
      });
    }
  }

  // 获取订单详情
  static async getOrderDetail(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('获取订单详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订单详情失败',
        error: error.message
      });
    }
  }

  // 更新订单
  static async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const db = require('../config/database');

      const fields = [];
      const values = [];

      const allowedFields = ['status', 'title', 'description', 'price', 'pickup_location', 'delivery_location'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }

      values.push(id);
      await db.execute(
        `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      const order = await Order.findById(id);

      res.json({
        success: true,
        message: '订单更新成功',
        data: order
      });
    } catch (error) {
      console.error('更新订单错误:', error);
      res.status(500).json({
        success: false,
        message: '更新订单失败',
        error: error.message
      });
    }
  }

  // 删除订单
  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const db = require('../config/database');

      await db.execute('DELETE FROM orders WHERE id = ?', [id]);

      res.json({
        success: true,
        message: '订单删除成功'
      });
    } catch (error) {
      console.error('删除订单错误:', error);
      res.status(500).json({
        success: false,
        message: '删除订单失败',
        error: error.message
      });
    }
  }

  // 获取认证申请列表
  static async getCertifications(req, res) {
    try {
      const { page = 1, pageSize = 20, status, type, keyword } = req.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 20;
      const offset = (pageNum - 1) * pageSizeNum;
      const db = require('../config/database');

      let whereClause = '1=1';
      const params = [];

      if (status && status.trim() !== '') {
        whereClause += ' AND c.status = ?';
        params.push(status);
      }

      if (type && type.trim() !== '') {
        whereClause += ' AND c.type = ?';
        params.push(type);
      }

      if (keyword && keyword.trim() !== '') {
        whereClause += ' AND (c.real_name LIKE ? OR c.student_id LIKE ? OR c.school LIKE ? OR u.username LIKE ? OR u.nickname LIKE ?)';
        const searchTerm = `%${keyword}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const sql = `SELECT c.*, u.username, u.nickname, u.avatar 
         FROM certifications c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE ${whereClause}
         ORDER BY c.submitted_at DESC
         LIMIT ${pageSizeNum} OFFSET ${offset}`;

      const [certifications] = await db.execute(sql, params);

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM certifications c LEFT JOIN users u ON c.user_id = u.id WHERE ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          list: certifications,
          total: countResult[0].total,
          page: pageNum,
          pageSize: pageSizeNum
        }
      });
    } catch (error) {
      console.error('获取认证列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取认证列表失败',
        error: error.message
      });
    }
  }

  // 审核认证申请
  static async reviewCertification(req, res) {
    try {
      const { id } = req.params;
      const { status, reject_reason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的审核状态'
        });
      }

      if (status === 'rejected' && !reject_reason) {
        return res.status(400).json({
          success: false,
          message: '拒绝时必须提供原因'
        });
      }

      const certification = await Certification.review(id, {
        status,
        reject_reason,
        reviewer_id: req.admin.id
      });

      res.json({
        success: true,
        message: '审核完成',
        data: certification
      });
    } catch (error) {
      console.error('审核认证错误:', error);
      res.status(500).json({
        success: false,
        message: '审核认证失败',
        error: error.message
      });
    }
  }

  // 获取管理员列表
  static async getAdmins(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const result = await Admin.getAll(parseInt(page), parseInt(pageSize));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('获取管理员列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取管理员列表失败',
        error: error.message
      });
    }
  }

  // 创建管理员
  static async createAdmin(req, res) {
    try {
      const { username, password, name, email, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        });
      }

      const admin = await Admin.create({ username, password, name, email, role });

      res.json({
        success: true,
        message: '管理员创建成功',
        data: admin
      });
    } catch (error) {
      console.error('创建管理员错误:', error);
      res.status(500).json({
        success: false,
        message: '创建管理员失败',
        error: error.message
      });
    }
  }

  // 更新管理员
  static async updateAdmin(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const admin = await Admin.update(id, updateData);

      res.json({
        success: true,
        message: '管理员信息更新成功',
        data: admin
      });
    } catch (error) {
      console.error('更新管理员错误:', error);
      res.status(500).json({
        success: false,
        message: '更新管理员失败',
        error: error.message
      });
    }
  }

  // 删除管理员
  static async deleteAdmin(req, res) {
    try {
      const { id } = req.params;

      if (parseInt(id) === req.admin.id) {
        return res.status(400).json({
          success: false,
          message: '不能删除自己的账号'
        });
      }

      await Admin.delete(id);

      res.json({
        success: true,
        message: '管理员删除成功'
      });
    } catch (error) {
      console.error('删除管理员错误:', error);
      res.status(500).json({
        success: false,
        message: '删除管理员失败',
        error: error.message
      });
    }
  }

  // 获取提现申请列表
  static async getWithdrawRequests(req, res) {
    try {
      const { page = 1, pageSize = 20, status } = req.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 20;
      const offset = (pageNum - 1) * pageSizeNum;
      const db = require('../config/database');

      let whereClause = '1=1';
      const params = [];

      if (status && status.trim() !== '') {
        whereClause += ' AND w.status = ?';
        params.push(status);
      }

      const sql = `SELECT w.*, u.username, u.nickname, u.avatar, u.phone
         FROM withdraw_requests w
         LEFT JOIN users u ON w.user_id = u.id
         WHERE ${whereClause}
         ORDER BY w.created_at DESC
         LIMIT ${pageSizeNum} OFFSET ${offset}`;

      const [requests] = await db.execute(sql, params);

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM withdraw_requests w WHERE ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          list: requests,
          total: countResult[0].total,
          page: pageNum,
          pageSize: pageSizeNum
        }
      });
    } catch (error) {
      console.error('获取提现申请列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取提现申请列表失败',
        error: error.message
      });
    }
  }

  // 审核提现申请
  static async reviewWithdrawRequest(req, res) {
    try {
      const { id } = req.params;
      const { status, reject_reason } = req.body;
      const db = require('../config/database');

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的审核状态'
        });
      }

      if (status === 'rejected' && !reject_reason) {
        return res.status(400).json({
          success: false,
          message: '拒绝时必须提供原因'
        });
      }

      // 获取提现申请
      const [requests] = await db.execute(
        'SELECT * FROM withdraw_requests WHERE id = ?',
        [id]
      );

      if (requests.length === 0) {
        return res.status(404).json({
          success: false,
          message: '提现申请不存在'
        });
      }

      const request = requests[0];

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '该申请已处理'
        });
      }

      // 开始事务
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // 更新提现申请状态
        await connection.execute(
          `UPDATE withdraw_requests 
           SET status = ?, reject_reason = ?, reviewed_at = NOW(), reviewer_id = ?
           WHERE id = ?`,
          [status, reject_reason || null, req.admin.id, id]
        );

        // 获取用户当前余额
        const [users] = await connection.execute(
          'SELECT balance, frozen_balance FROM users WHERE id = ? FOR UPDATE',
          [request.user_id]
        );
        
        const currentBalance = parseFloat(users[0]?.balance) || 0;
        const frozenBalance = parseFloat(users[0]?.frozen_balance) || 0;

        if (status === 'approved') {
          // 审核通过：从冻结余额扣除（钱已经打给用户了）
          const newFrozenBalance = frozenBalance - parseFloat(request.amount);
          
          await connection.execute(
            'UPDATE users SET frozen_balance = ? WHERE id = ?',
            [newFrozenBalance, request.user_id]
          );

          // 记录交易（提现成功）
          await connection.execute(
            `INSERT INTO wallet_transactions 
            (user_id, type, amount, balance_before, balance_after, title, description, status, created_at) 
            VALUES (?, 'withdraw', ?, ?, ?, '提现成功', ?, 'completed', NOW())`,
            [
              request.user_id,
              request.amount,
              currentBalance,
              currentBalance,
              `提现 ¥${request.amount} 到${request.account_type === 'wechat' ? '微信' : request.account_type === 'alipay' ? '支付宝' : '银行卡'}，已到账`
            ]
          );
        } else {
          // 审核拒绝：解冻余额，返还到可用余额
          const newBalance = currentBalance + parseFloat(request.amount);
          const newFrozenBalance = frozenBalance - parseFloat(request.amount);
          
          await connection.execute(
            'UPDATE users SET balance = ?, frozen_balance = ? WHERE id = ?',
            [newBalance, newFrozenBalance, request.user_id]
          );

          // 记录交易（提现拒绝，解冻）
          await connection.execute(
            `INSERT INTO wallet_transactions 
            (user_id, type, amount, balance_before, balance_after, title, description, status, created_at) 
            VALUES (?, 'unfreeze', ?, ?, ?, '提现拒绝退回', ?, 'completed', NOW())`,
            [
              request.user_id,
              request.amount,
              currentBalance,
              newBalance,
              `提现申请被拒绝，¥${request.amount} 已退回余额。原因：${reject_reason}`
            ]
          );
        }

        await connection.commit();

        res.json({
          success: true,
          message: status === 'approved' ? '提现申请已通过，请确保已将款项转账至用户账户' : '提现申请已拒绝，金额已退回用户余额'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('审核提现申请错误:', error);
      res.status(500).json({
        success: false,
        message: '审核提现申请失败',
        error: error.message
      });
    }
  }

  // 获取反馈列表
  static async getFeedbacks(req, res) {
    try {
      const { page = 1, pageSize = 20, status, type, keyword } = req.query;
      const Feedback = require('../models/Feedback');

      const result = await Feedback.getAll(
        parseInt(page),
        parseInt(pageSize),
        { status, type, keyword }
      );

      res.json({
        success: true,
        data: {
          list: result.list,
          total: result.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error('获取反馈列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取反馈列表失败',
        error: error.message
      });
    }
  }

  // 回复反馈
  static async replyFeedback(req, res) {
    try {
      const { id } = req.params;
      const { reply, status } = req.body;
      const Feedback = require('../models/Feedback');

      if (!reply || !reply.trim()) {
        return res.status(400).json({
          success: false,
          message: '请输入回复内容'
        });
      }

      const feedback = await Feedback.findById(id);
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: '反馈不存在'
        });
      }

      const updatedFeedback = await Feedback.reply(id, {
        reply: reply.trim(),
        status: status || 'resolved',
        replied_by: req.admin.id
      });

      res.json({
        success: true,
        message: '回复成功',
        data: updatedFeedback
      });
    } catch (error) {
      console.error('回复反馈错误:', error);
      res.status(500).json({
        success: false,
        message: '回复失败',
        error: error.message
      });
    }
  }

  // 更新反馈状态
  static async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const Feedback = require('../models/Feedback');

      if (!['pending', 'processing', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态'
        });
      }

      const feedback = await Feedback.updateStatus(id, status);

      res.json({
        success: true,
        message: '状态更新成功',
        data: feedback
      });
    } catch (error) {
      console.error('更新反馈状态错误:', error);
      res.status(500).json({
        success: false,
        message: '更新状态失败',
        error: error.message
      });
    }
  }

  // 获取反馈统计
  static async getFeedbackStats(req, res) {
    try {
      const Feedback = require('../models/Feedback');
      const stats = await Feedback.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取反馈统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取统计失败',
        error: error.message
      });
    }
  }
}


module.exports = AdminController;
