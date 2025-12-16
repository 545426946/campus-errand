const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/user', require('./routes/user.routes')); // 兼容前端 /api/user 路径
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/orders', require('./routes/order.routes')); // 订单路由
app.use('/api/notifications', require('./routes/notification.routes')); // 通知路由
app.use('/api/ai', require('./routes/ai.routes'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 错误处理
app.use(require('./middleware/errorHandler'));

module.exports = app;
