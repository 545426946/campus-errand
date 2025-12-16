-- AI驱动智慧学习与管理平台数据库
CREATE DATABASE IF NOT EXISTS errand_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE errand_platform;

-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  nickname VARCHAR(100) COMMENT '昵称',
  openid VARCHAR(100) UNIQUE COMMENT '微信openid',
  role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
  avatar VARCHAR(255),
  phone VARCHAR(20),
  student_id VARCHAR(50),
  major VARCHAR(100),
  grade VARCHAR(20),
  balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '账户余额',
  certification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '认证状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_openid (openid),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程表
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  instructor_id INT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  cover_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程内容表
CREATE TABLE course_contents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_type ENUM('video', 'document', 'quiz', 'assignment') NOT NULL,
  url VARCHAR(500),
  duration INT COMMENT '时长（分钟）',
  content_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程报名表
CREATE TABLE course_enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  student_id INT NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0.00,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (course_id, student_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务表
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  task_type ENUM('assignment', 'project', 'quiz', 'errand') NOT NULL,
  course_id INT,
  creator_id INT NOT NULL,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date DATETIME NOT NULL,
  ai_difficulty VARCHAR(50),
  ai_estimated_time INT COMMENT 'AI预估时间（分钟）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_type (task_type),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务分配表
CREATE TABLE task_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (task_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务提交表
CREATE TABLE task_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT,
  grade DECIMAL(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task (task_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 提交文件表
CREATE TABLE submission_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  submission_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI推荐标签表
CREATE TABLE course_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_tag (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI建议表
CREATE TABLE ai_suggestions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  suggestion TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学习进度表
CREATE TABLE learning_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  content_id INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_position INT COMMENT '视频播放位置（秒）',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES course_contents(id) ON DELETE CASCADE,
  UNIQUE KEY unique_progress (user_id, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI聊天记录表
CREATE TABLE ai_chat_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT NOT NULL,
  context JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单表（校园跑腿）
CREATE TABLE orders (
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

-- 订单评价表
CREATE TABLE order_evaluations (
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

-- 通知表
CREATE TABLE notifications (
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
