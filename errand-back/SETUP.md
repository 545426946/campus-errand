# 后端项目设置指南

## 1. 安装依赖
已完成 ✓

## 2. 配置环境变量
已创建 `.env` 文件，请根据实际情况修改：
- `DB_PASSWORD`: MySQL数据库密码
- `JWT_SECRET`: JWT密钥（生产环境请使用强密码）
- `AI_API_KEY`: AI服务API密钥（如需使用AI功能）

## 3. 导入数据库

### 方法一：使用批处理脚本（推荐）
双击运行 `setup-database.bat`，按提示输入MySQL密码

### 方法二：手动导入
```bash
# 导入数据库结构
mysql -u root -p < database/schema.sql

# 导入测试数据（可选）
mysql -u root -p < database/seed.sql
```

### 方法三：使用MySQL客户端
1. 打开MySQL Workbench或其他客户端
2. 连接到数据库
3. 执行 `database/schema.sql` 文件
4. （可选）执行 `database/seed.sql` 文件

## 4. 启动服务器

### 方法一：使用批处理脚本
双击运行 `start-dev.bat`

### 方法二：使用命令行
```bash
npm run dev
```

## 5. 测试API
服务器启动后访问：http://localhost:3000/health

## 测试账号（如果导入了测试数据）
- 管理员: admin@example.com / admin123
- 教师: teacher1@example.com / admin123
- 学生: student1@example.com / admin123

## API文档
详见 README.md
