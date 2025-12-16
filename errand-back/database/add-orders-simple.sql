-- 添加订单表到现有数据库（简化版）
USE errand_platform;

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '发布者ID',
  acceptor_id INT NULL COMMENT '接单者ID',
  title VARCHAR(200) NOT NULL COMMENT '订单标题',
  description TEXT NOT NULL COMMENT '订单描述',
  type INT NOT NULL COMMENT '服务类型：1-快递代取，2-外卖配送，3-代购服务，4-其他',
  price DECIMAL(10,2) NOT NULL COMMENT '订单价格',
  pickup_location VARCHAR(255) NOT NULL COMMENT '取货地点',
  delivery_location VARCHAR(255) NOT NULL COMMENT '送货地点',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  images JSON COMMENT '订单图片',
  status ENUM('pending', 'accepted', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
  cancel_reason VARCHAR(500) COMMENT '取消原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL COMMENT '接单时间',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  cancelled_at TIMESTAMP NULL COMMENT '取消时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (acceptor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_acceptor (acceptor_id),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校园跑腿订单表';

-- 为users表添加额外字段
-- 如果字段已存在会报错，请忽略错误或手动添加

-- 添加nickname字段
ALTER TABLE users ADD COLUMN nickname VARCHAR(100) COMMENT '昵称';

-- 添加openid字段
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE COMMENT '微信openid';

-- 添加balance字段
ALTER TABLE users ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '账户余额';

-- 添加certification_status字段
ALTER TABLE users ADD COLUMN certification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '认证状态';

SELECT 'Orders table created successfully!' as message;
