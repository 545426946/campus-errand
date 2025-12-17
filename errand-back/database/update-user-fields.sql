-- 更新用户表，添加实名认证相关字段
USE errand_platform;

-- 检查并添加 real_name 字段
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'errand_platform' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'real_name';

SET @query = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN real_name VARCHAR(50) COMMENT ''真实姓名'' AFTER nickname',
  'SELECT ''Column real_name already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 id_card 字段
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'errand_platform' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'id_card';

SET @query = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN id_card VARCHAR(18) COMMENT ''身份证号'' AFTER real_name',
  'SELECT ''Column id_card already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新 certification_status 字段（如果不存在则添加）
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'errand_platform' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'certification_status';

SET @query = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN certification_status ENUM(''none'', ''pending'', ''approved'', ''rejected'') DEFAULT ''none'' COMMENT ''认证状态'' AFTER id_card',
  'SELECT ''Column certification_status already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加订单浏览量字段
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'errand_platform' 
AND TABLE_NAME = 'orders' 
AND COLUMN_NAME = 'view_count';

SET @query = IF(@col_exists = 0,
  'ALTER TABLE orders ADD COLUMN view_count INT DEFAULT 0 COMMENT ''浏览次数'' AFTER images',
  'SELECT ''Column view_count already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'User fields update completed' AS status;
