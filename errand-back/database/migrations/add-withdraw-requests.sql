-- 添加提现申请表
USE errand_platform;

-- 创建提现申请表
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  amount DECIMAL(10,2) NOT NULL COMMENT '提现金额',
  account VARCHAR(200) NOT NULL COMMENT '提现账号',
  account_type ENUM('wechat', 'alipay', 'bank') DEFAULT 'wechat' COMMENT '账号类型',
  real_name VARCHAR(100) COMMENT '真实姓名',
  status ENUM('pending', 'approved', 'completed', 'rejected', 'cancelled') DEFAULT 'pending' COMMENT '申请状态',
  admin_id INT NULL COMMENT '审核管理员ID',
  admin_note TEXT COMMENT '管理员备注',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提现申请表';

SELECT '提现申请表创建完成' AS message;
