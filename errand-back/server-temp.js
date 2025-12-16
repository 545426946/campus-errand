const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 临时登录接口 - 返回模拟数据
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log('登录请求:', { username, password });
  
  // 模拟登录成功响应
  res.json({
    success: true,
    message: '登录成功',
    data: {
      token: 'mock_token_12345',
      user: {
        id: 1,
        username: username,
        nickname: '测试用户',
        avatar: '',
        role: 'student'
      }
    }
  });
});

// 临时订单接口 - 返回模拟数据
app.get('/api/orders', (req, res) => {
  console.log('获取订单列表');
  
  // 模拟订单数据
  const orders = [
    {
      id: 1,
      title: '代取快递',
      description: '帮忙代取中通快递',
      status: 'pending',
      type: 'delivery',
      price: 5,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: '文件递送',
      description: '从图书馆递送文件到宿舍',
      status: 'accepted',
      type: 'delivery',
      price: 8,
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: {
      orders: orders,
      total: orders.length,
      page: 1,
      pageSize: 10
    }
  });
});

// 其他所有接口的通用响应
app.all('*', (req, res) => {
  console.log(`API请求: ${req.method} ${req.url}`);
  res.json({
    success: true,
    message: '接口开发中',
    data: null
  });
});

const PORT = 3000;

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`临时服务器运行在端口 ${PORT}`);
  console.log('数据库连接已禁用 - 使用模拟数据');
  console.log('前端可以正常连接测试');
});

console.log('服务器启动完成，前端现在可以连接了！');