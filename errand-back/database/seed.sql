-- 测试数据
USE errand_platform;

-- 插入管理员用户（密码: admin123）
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'admin'),
('teacher1', 'teacher1@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'teacher'),
('student1', 'student1@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student');

-- 插入示例课程
INSERT INTO courses (title, description, instructor_id, category, difficulty) VALUES
('Python编程基础', '从零开始学习Python编程语言，掌握基础语法和常用库', 2, '编程', 'beginner'),
('数据结构与算法', '深入学习常用数据结构和算法，提升编程能力', 2, '计算机科学', 'intermediate'),
('Web前端开发', '学习HTML、CSS、JavaScript，构建现代化Web应用', 2, '编程', 'beginner');

-- 插入课程内容
INSERT INTO course_contents (course_id, title, content_type, url, duration, content_order) VALUES
(1, 'Python简介与环境搭建', 'video', 'https://example.com/video1.mp4', 30, 1),
(1, '变量与数据类型', 'video', 'https://example.com/video2.mp4', 45, 2),
(1, '第一章测验', 'quiz', NULL, 15, 3);

-- 插入课程报名
INSERT INTO course_enrollments (course_id, student_id, progress) VALUES
(1, 3, 25.50),
(2, 3, 10.00);

-- 插入示例任务
INSERT INTO tasks (title, description, task_type, course_id, creator_id, status, priority, due_date) VALUES
('Python基础作业1', '完成变量和数据类型相关练习题', 'assignment', 1, 2, 'pending', 'medium', DATE_ADD(NOW(), INTERVAL 7 DAY)),
('期末项目', '开发一个完整的Web应用', 'project', 3, 2, 'in-progress', 'high', DATE_ADD(NOW(), INTERVAL 30 DAY));

-- 插入任务分配
INSERT INTO task_assignments (task_id, user_id) VALUES
(1, 3),
(2, 3);

-- 插入课程标签
INSERT INTO course_tags (course_id, tag_name) VALUES
(1, 'Python'),
(1, '编程入门'),
(2, '算法'),
(2, '数据结构'),
(3, 'JavaScript'),
(3, 'HTML'),
(3, 'CSS');
