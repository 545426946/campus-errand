-- 更新数据库schema，添加订单系统需要的字段
USE errand_platform;

-- 为users表添加新字段（如果不存在）
ALTER TABLE users 
  MODIFY COLUMN username VARCHAR(50) UNIQUE NULL,
  MODIFY COLUMN email VARCHAR(100) UNIQUE NULL,
  MODIFY COLUMN password VARCHAR(255) NULL;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) COMMENT '昵称',
  ADD COLUMN IF NOT EXISTS openid VARCHAR(100) UNIQUE COMMENT '微信openid',
  ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '账户余额',
  ADD COLUMN IF NOT EXISTS certification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '认证状态';

-- 添加索引
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_openid (openid);

-- 创建订单评价表（如果不存在）
CREATE TABLE IF NOT EXISTS order_evaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL COMMENT '订单ID',
  user_id INT NOT NULL COMMENT '评价者ID',
  rating INT NOT NULL COMMENT '评分（1-5）',
  comment TEXT COMMENT '评价内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单评价表';

SELECT '数据库更新完成' AS message;
