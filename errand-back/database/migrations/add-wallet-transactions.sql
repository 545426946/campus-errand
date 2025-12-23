-- 添加钱包交易记录表
USE errand_platform;

-- 创建钱包交易记录表
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  type ENUM('recharge', 'withdraw', 'income', 'expense', 'freeze', 'unfreeze') NOT NULL COMMENT '交易类型',
  amount DECIMAL(10,2) NOT NULL COMMENT '交易金额',
  balance_before DECIMAL(10,2) NOT NULL COMMENT '交易前余额',
  balance_after DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
  title VARCHAR(200) NOT NULL COMMENT '交易标题',
  description TEXT COMMENT '交易描述',
  order_id INT NULL COMMENT '关联订单ID',
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'completed' COMMENT '交易状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包交易记录表';

-- 为用户表添加更多钱包相关字段（如果不存在）
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS frozen_balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '冻结余额',
  ADD COLUMN IF NOT EXISTS total_income DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计收入',
  ADD COLUMN IF NOT EXISTS total_expense DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计支出';

SELECT '钱包交易记录表创建完成' AS message;