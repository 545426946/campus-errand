-- 创建测试用户（用于前端测试）
USE errand_platform;

-- 删除已存在的测试用户
DELETE FROM users WHERE email LIKE '%test%@example.com';

-- 插入测试用户（密码都是 admin123）
INSERT INTO users (username, email, password, role, nickname) VALUES
('testuser1', 'testuser1@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', '测试用户1'),
('testuser2', 'testuser2@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', '测试用户2');

-- 验证创建结果
SELECT id, username, email, role, nickname FROM users WHERE email LIKE '%test%@example.com';