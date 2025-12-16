# 校园跑腿平台

一个基于微信小程序的校园跑腿服务平台，包含订单发布、接单、支付等完整功能。

## 项目结构

```
campus-errand/
├── errand-back/          # 后端服务 (Node.js + Express + MySQL)
├── errand-front/         # 前端小程序 (微信小程序)
└── README.md
```

## 📚 文档导航

**[📚 文档导航.md](./📚%20文档导航.md)** - 查看所有文档的完整导航

### 快速链接
- **[快速开始指南.md](./快速开始指南.md)** ⭐ - 5分钟快速启动
- **[配置完成总结.md](./配置完成总结.md)** - 项目概览和核心功能
- **[前后端数据交互配置说明.md](./前后端数据交互配置说明.md)** - 详细配置步骤
- **[前后端数据交互测试指南.md](./前后端数据交互测试指南.md)** - 完整测试流程
- **[验证检查清单.md](./验证检查清单.md)** - 功能验证清单

## 快速开始

### 后端启动

1. 进入后端目录
```bash
cd errand-back
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 为 `.env` 并配置数据库信息

4. 初始化数据库
```bash
setup-database.bat
```

5. 启动服务器
```bash
npm run dev
# 或使用
start-dev.bat
```

服务器将运行在 http://localhost:3000

### 前端启动

1. 使用微信开发者工具打开 `errand-front` 目录

2. 配置后端API地址
在 `errand-front/utils/config.js` 中配置：
```javascript
baseUrl: 'http://localhost:3000/api'
```

3. 编译并运行

## 主要功能

- ✅ 用户认证（微信登录/邮箱登录）
- ✅ 订单管理（发布/接单/取消/完成）
- ✅ 订单筛选和搜索（支持分页）
- ✅ 用户个人中心（订单统计、钱包）
- ✅ 订单状态跟踪
- ✅ **消息通知系统**（订单状态变更自动通知）
- ✅ 前后端完整数据交互
- ✅ 动态数据加载（从MySQL数据库）

## 技术栈

### 后端
- Node.js + Express
- MySQL 数据库
- JWT 认证
- bcryptjs 密码加密

### 前端
- 微信小程序
- 微信小程序API

## 前后端数据交互

### 🎯 已完成配置

本项目已完成前后端完整数据交互配置：

- ✅ 前端通过API从MySQL数据库动态获取数据
- ✅ 所有页面数据均为动态加载（非静态数据）
- ✅ 完整的认证和权限控制
- ✅ 统一的错误处理和提示
- ✅ 支持分页、筛选、搜索

### 📚 配置文档

- **[前后端数据交互配置说明.md](./前后端数据交互配置说明.md)** - 完整配置说明
- **[前后端数据交互测试指南.md](./前后端数据交互测试指南.md)** - 详细测试步骤

### 🚀 一键配置

运行配置脚本自动完成所有配置：
```bash
配置前后端数据交互.bat
```

## API文档

### 认证接口
- `POST /api/auth/login` - 用户登录（支持微信code和邮箱密码）
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 订单接口
- `GET /api/orders` - 获取订单列表（支持分页、筛选）
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id` - 更新订单
- `DELETE /api/orders/:id` - 删除订单
- `POST /api/orders/:id/accept` - 接单
- `POST /api/orders/:id/complete` - 完成订单
- `POST /api/orders/:id/cancel` - 取消订单
- `GET /api/orders/my-publish` - 我发布的订单
- `GET /api/orders/my-accepted` - 我接受的订单
- `GET /api/orders/stats` - 订单统计

### 用户接口
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/user/info` - 更新用户信息
- `GET /api/user/wallet` - 获取钱包信息

### 通知接口
- `GET /api/notifications` - 获取通知列表
- `GET /api/notifications/unread-count` - 获取未读数量
- `PUT /api/notifications/:id/read` - 标记已读
- `PUT /api/notifications/read-all` - 全部已读
- `DELETE /api/notifications/:id` - 删除通知

## 测试账号

所有测试账号密码都是: `admin123`

| 用户名 | 邮箱 | 角色 |
|--------|------|------|
| student1 | student1@example.com | 学生 |
| student2 | student2@example.com | 学生 |
| teacher1 | teacher1@example.com | 教师 |
| admin | admin@example.com | 管理员 |

## 测试数据

数据库已包含15条测试订单：
- 6条待接单订单
- 3条进行中订单
- 4条已完成订单
- 2条已取消订单

## 微信小程序配置

1. 使用微信开发者工具打开 `errand-front` 目录
2. 在 **详情 > 本地设置** 中勾选：
   - ✅ 不校验合法域名
   - ✅ 不校验安全域名
3. 编译运行即可

详细测试指南请查看 [测试指南.md](./测试指南.md)

## 快速启动

双击运行 `快速启动.bat` 即可启动后端服务器

或手动启动：
```bash
cd errand-back
npm run dev
```

## 开发说明

- 后端默认端口: 3000
- 数据库: MySQL 5.7+
- Node.js版本: 14+
- 前端自动登录: student1@example.com

## 项目特点

- ✅ 完整的前后端分离架构
- ✅ 前端数据完全动态加载（从MySQL数据库）
- ✅ JWT身份认证（支持微信登录）
- ✅ **消息通知系统**（订单状态变更自动通知）
- ✅ **实时数据同步**（前端操作触发后端数据变更）
- ✅ RESTful API设计
- ✅ 统一的响应格式
- ✅ 完善的错误处理
- ✅ 分页、筛选、搜索功能
- ✅ 测试数据完备
- ✅ 一键配置脚本

## 许可证

MIT
