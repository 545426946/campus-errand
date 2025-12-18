# 数据库文件说明

## 目录结构

```
database/
├── migrations/          # 数据库迁移文件（表结构变更）
│   ├── schema.sql                      # 主数据库架构
│   ├── add-notifications-table.sql     # 添加通知表
│   ├── update-schema.sql               # 更新数据库架构
│   └── update-user-fields.sql          # 更新用户表字段
├── seeds/              # 数据库种子文件（测试数据）
│   ├── seed.sql                        # 基础种子数据
│   ├── add-orders-data.sql             # 订单测试数据
│   └── create-test-users.sql           # 创建测试用户
└── README.md           # 本文件
```

## 文件说明

### Migrations（迁移文件）

#### 1. schema.sql
- **用途**: 创建完整的数据库架构
- **包含**: 所有表的创建语句
- **使用场景**: 首次初始化数据库

#### 2. add-notifications-table.sql
- **用途**: 添加通知功能相关的表
- **包含**: notifications 表的创建语句
- **使用场景**: 在现有数据库上添加通知功能

#### 3. update-schema.sql
- **用途**: 更新数据库架构
- **包含**: 表结构的修改语句
- **使用场景**: 升级数据库结构

#### 4. update-user-fields.sql
- **用途**: 更新用户表字段
- **包含**: 添加 nickname、openid、balance 等字段
- **使用场景**: 为用户表添加新字段

### Seeds（种子数据）

#### 1. seed.sql
- **用途**: 插入基础测试数据
- **包含**: 基础用户、课程、任务等数据
- **使用场景**: 开发和测试环境

#### 2. add-orders-data.sql
- **用途**: 插入订单测试数据
- **包含**: 各种状态的订单数据（待接单、已接单、已完成、已取消）
- **使用场景**: 测试订单功能

#### 3. create-test-users.sql
- **用途**: 创建测试用户
- **包含**: 测试用户账号（密码: admin123）
- **使用场景**: 前端测试登录功能

## 使用方法

### 首次初始化数据库

```bash
# Windows
cd errand-back
setup-database.bat
```

或手动执行：

```bash
# 1. 创建数据库架构
mysql -u root -p < database/migrations/schema.sql

# 2. 插入基础数据
mysql -u root -p < database/seeds/seed.sql

# 3. 插入订单测试数据
mysql -u root -p < database/seeds/add-orders-data.sql
```

### 更新数据库结构

```bash
# 添加通知表
mysql -u root -p < database/migrations/add-notifications-table.sql

# 更新用户表字段
mysql -u root -p < database/migrations/update-user-fields.sql
```

### 重置测试数据

```bash
# 重新创建测试用户
mysql -u root -p < database/seeds/create-test-users.sql

# 重新插入订单数据
mysql -u root -p < database/seeds/add-orders-data.sql
```

## 注意事项

1. **执行顺序**: 先执行 migrations，再执行 seeds
2. **备份数据**: 在执行迁移前请备份重要数据
3. **测试环境**: seeds 文件仅用于开发和测试环境
4. **密码安全**: 测试用户的密码都是 `admin123`，生产环境请修改

## 测试用户账号

| 用户名 | 邮箱 | 密码 | 角色 | 昵称 |
|--------|------|------|------|------|
| admin | admin@example.com | admin123 | admin | 管理员 |
| teacher1 | teacher1@example.com | admin123 | teacher | 张老师 |
| student1 | student1@example.com | admin123 | student | 小明同学 |
| student2 | student2@example.com | admin123 | student | 小红同学 |
| student3 | student3@example.com | admin123 | student | 小刚同学 |
| student4 | student4@example.com | admin123 | student | 小丽同学 |
