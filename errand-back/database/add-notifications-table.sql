-- 添加通知表
USE errand_platform;

-- 创建通知表（如果不存在）
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '接收用户ID',
  order_id INT COMMENT '关联订单ID',
  type VARCHAR(50) NOT NULL COMMENT '通知类型：order_accepted, order_completed, order_cancelled等',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT NOT NULL COMMENT '通知内容',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  read_at TIMESTAMP NULL COMMENT '阅读时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_order (order_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- 插入一些测试通知数据
INSERT INTO notifications (user_id, order_id, type, title, content, is_read, created_at) VALUES
(3, 7, 'order_accepted', '订单已被接单', '您的订单"Buy breakfast"已被接单', false, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 10, 'order_completed', '订单已完成', '您的订单"Pick up package"已完成', false, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 8, 'order_accepted', '订单已被接单', '您的订单"Pick up package"已被接单', true, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(4, 11, 'order_completed', '订单已完成', '您的订单"Buy lunch"已完成', true, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 9, 'order_accepted', '订单已被接单', '您的订单"Buy snacks"已被接单', false, DATE_SUB(NOW(), INTERVAL 20 HOUR));

SELECT '通知表创建完成，已插入测试数据' AS message;
