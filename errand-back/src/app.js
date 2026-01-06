const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
// 管理员路由（必须在其他路由之前，避免被认证中间件拦截）
app.use('/api/admin', require('./routes/admin.routes'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/user', require('./routes/user.routes')); // 兼容前端 /api/user 路径
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/orders', require('./routes/order.routes')); // 订单路由
app.use('/api/notifications', require('./routes/notification.routes')); // 通知路由
app.use('/api/system', require('./routes/system.routes')); // 系统路由
app.use('/api/upload', require('./routes/upload.routes')); // 上传路由
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/messages', require('./routes/message.routes')); // 消息路由
app.use('/api', require('./routes/cancelRequest.routes')); // 取消请求路由
app.use('/api/certification', require('./routes/certification.routes')); // 认证路由
app.use('/api/withdraw', require('./routes/withdraw.routes')); // 提现路由

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 错误处理
app.use(require('./middleware/errorHandler'));

module.exports = app;
