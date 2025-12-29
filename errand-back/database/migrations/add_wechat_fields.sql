-- 添加微信登录相关字段
-- 执行前请先备份数据库

-- 检查并添加 openid 字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS openid VARCHAR(100) UNIQUE COMMENT '微信 openid',
ADD COLUMN IF NOT EXISTS unionid VARCHAR(100) UNIQUE COMMENT '微信 unionid',
ADD COLUMN IF NOT EXISTS session_key VARCHAR(100) COMMENT '微信 session_key',
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) COMMENT '用户昵称',
ADD COLUMN IF NOT EXISTS gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
ADD COLUMN IF NOT EXISTS school VARCHAR(100) COMMENT '学校',
ADD COLUMN IF NOT EXISTS bio TEXT COMMENT '个人简介';

-- 为 openid 和 unionid 创建索引
CREATE INDEX IF NOT EXISTS idx_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_unionid ON users(unionid);

-- 修改 password 字段允许为空（微信登录用户可能没有密码）
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL COMMENT '密码（微信登录用户可为空）';

-- 修改 email 字段允许为空
ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NULL COMMENT '邮箱（可选）';

-- 添加注释
ALTER TABLE users COMMENT = '用户表（支持账号密码登录和微信登录）';
