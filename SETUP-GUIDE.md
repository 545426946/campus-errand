# 项目启动指南

## 前置条件
1. 已安装 Node.js (v14+)
2. 已安装 MySQL (5.7+)
3. 已安装微信开发者工具

## 步骤一: 初始化数据库

### 方法1: 使用命令行(推荐)
打开命令行,执行以下命令:

```bash
# 创建数据库
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS errand_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据库结构
mysql -u root -p123456 errand_platform < database/migrations/schema.sql

# 导入钱包交易表
mysql -u root -p123456 errand_platform < database/migrations/add-wallet-transactions.sql

# 导入通知表
mysql -u root -p123456 errand_platform < database/migrations/add-notifications-table.sql

# 导入微信字段
mysql -u root -p123456 errand_platform < database/migrations/add_wechat_fields.sql

# 更新用户表
mysql -u root -p123456 errand_platform < database/migrations/update-user-fields.sql
```

### 方法2: 使用初始化脚本
双击运行 `init-db.bat` 脚本即可

## 步骤二: 安装依赖

```bash
cd errand-back
npm install
```

## 步骤三: 启动后端服务

### 方法1: 命令行启动
```bash
cd errand-back
node server.js
```

### 方法2: 使用启动脚本
双击运行 `start-server.bat`

### 方法3: 开发模式(带热重载)
```bash
cd errand-back
npm run dev
```

看到以下输出表示启动成功:
```
MySQL 连接成功: localhost
服务器运行在端口 3000
环境: development
```

## 步骤四: 启动小程序

1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择 `errand-front` 目录
4. 填写项目名称和 AppID(测试号可使用测试号)
5. 点击"导入"

## 步骤五: 测试功能

1. 在小程序中点击"我的" -> "登录"
2. 使用测试账号登录:
   - 用户名: user15
   - 密码: 123456
3. 浏览首页,查看订单列表
4. 尝试发布新订单

## 常见问题

### 1. 数据库连接失败
检查 `errand-back/.env` 文件中的数据库配置:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=errand_platform
```

### 2. 后端服务无法启动
- 检查端口 3000 是否被占用
- 确保数据库已经初始化
- 查看控制台错误信息

### 3. 小程序无法连接后端
- 确认后端服务正在运行
- 检查 `errand-front/utils/config.js` 中的 API 地址是否正确
- 开发环境应使用 `http://localhost:3000/api`

### 4. 页面显示空白
- 检查后端服务是否正常
- 打开小程序调试控制台查看错误
- 确认数据库中有数据

## 数据库管理

### 查看数据库状态
```bash
mysql -u root -p123456 -e "USE errand_platform; SHOW TABLES;"
```

### 重置数据库(慎用)
```bash
mysql -u root -p123456 -e "DROP DATABASE IF EXISTS errand_platform; CREATE DATABASE errand_platform DEFAULT CHARACTER SET utf8mb4;"
```

然后重新执行步骤一的数据库初始化命令。

### 查看用户数据
```bash
mysql -u root -p123456 -e "USE errand_platform; SELECT id, username, nickname, balance FROM users;"
```
