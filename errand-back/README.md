# AI驱动智慧学习与管理平台 - 后端

## 项目简介
基于Node.js + Express + MongoDB的智慧学习管理平台后端系统，集成AI功能提供个性化学习推荐和智能分析。

## 技术栈
- Node.js + Express
- MySQL + mysql2
- JWT身份认证
- AI集成（可扩展OpenAI等服务）

## 快速开始

### 1. 安装依赖
```bash
cd errand-back
npm install
```

### 2. 配置数据库
导入数据库结构：
```bash
mysql -u root -p < database/schema.sql
```

导入测试数据（可选）：
```bash
mysql -u root -p < database/seed.sql
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env` 并配置：
```bash
cp .env.example .env
```

### 4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API文档

### 认证模块 `/api/auth`
- POST `/register` - 用户注册
- POST `/login` - 用户登录
- GET `/me` - 获取当前用户信息

### 课程模块 `/api/courses`
- GET `/` - 获取所有课程
- GET `/:id` - 获取课程详情
- POST `/` - 创建课程（教师/管理员）
- PUT `/:id` - 更新课程
- POST `/:id/enroll` - 报名课程

### 任务模块 `/api/tasks`
- GET `/` - 获取任务列表
- GET `/:id` - 获取任务详情
- POST `/` - 创建任务（教师/管理员）
- POST `/:id/submit` - 提交任务

### AI模块 `/api/ai`
- GET `/recommendations` - 获取课程推荐
- GET `/analysis` - 学习进度分析
- POST `/chat` - AI聊天助手
- POST `/generate-quiz` - AI生成测验

## 项目结构
```
errand-back/
├── src/
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── middleware/     # 中间件
│   └── app.js          # Express应用
├── server.js           # 入口文件
└── package.json
```

## 数据模型

### User（用户）
- 基本信息：用户名、邮箱、密码
- 角色：学生、教师、管理员
- 个人资料：头像、电话、学号、专业等
- 学习进度跟踪

### Course（课程）
- 课程信息：标题、描述、分类、难度
- 讲师信息
- 课程内容（视频、文档、测验等）
- 已报名学生
- AI推荐标签

### Task（任务）
- 任务类型：作业、项目、测验、跑腿
- 状态管理：待处理、进行中、已完成
- 提交记录和评分
- AI分析（难度、预估时间、建议）

## 开发说明
- 所有API需要JWT认证（除注册/登录）
- 教师和管理员拥有更高权限
- AI功能可根据需求集成具体服务
- 支持文件上传功能
