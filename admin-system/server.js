const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'errand_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
pool.getConnection()
  .then(conn => {
    console.log('✅ 数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
  });

// API路由
app.get('/api/stats', async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [orders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [completedOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    const [pendingOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");

    res.json({
      success: true,
      data: {
        totalUsers: users[0].count,
        totalOrders: orders[0].count,
        completedOrders: completedOrders[0].count,
        pendingOrders: pendingOrders[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM users';
    let params = [];

    if (search) {
      query += ' WHERE username LIKE ? OR nickname LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [users] = await pool.execute(query, params);

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 获取用户的订单统计
    const [orderStats] = await pool.execute(
      `SELECT
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders
       FROM orders WHERE user_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...users[0],
        orderStats: orderStats[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT o.*, u.username as publisher_name, u.nickname as publisher_nickname
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    let params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (o.title LIKE ? OR o.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [orders] = await pool.execute(query, params);

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM orders');
    const total = countResult[0].total;

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.execute(
      `SELECT o.*,
        u.username as publisher_name,
        u.nickname as publisher_nickname,
        u.phone as publisher_phone,
        a.username as acceptor_name,
        a.nickname as acceptor_nickname
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users a ON o.acceptor_id = a.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    res.json({
      success: true,
      data: orders[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 默认路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('=================================');
  console.log(`后台管理系统启动成功`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`=================================`);
});
