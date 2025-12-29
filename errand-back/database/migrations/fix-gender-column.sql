-- 修复 gender 字段类型
-- 将 gender 从 TINYINT 改为 ENUM 或统一为 TINYINT

USE errand_platform;

-- 检查当前 gender 字段类型
SHOW COLUMNS FROM users LIKE 'gender';

-- 方案1：统一使用 TINYINT (0=未知, 1=男, 2=女)
-- 如果当前是 ENUM 类型，先删除再添加
ALTER TABLE users MODIFY COLUMN gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女';

-- 验证修改
SHOW COLUMNS FROM users LIKE 'gender';

SELECT '✓ gender 字段已修复为 TINYINT 类型' AS message;
