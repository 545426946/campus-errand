-- 添加订单测试数据
USE errand_platform;

-- 首先确保users表有nickname字段（如果没有则添加）
-- 如果字段已存在会报错，可以忽略
-- ALTER TABLE users ADD COLUMN nickname VARCHAR(100) COMMENT '昵称';
-- ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE COMMENT '微信openid';

-- 更新现有用户的昵称
UPDATE users SET nickname = '管理员' WHERE username = 'admin';
UPDATE users SET nickname = '张老师' WHERE username = 'teacher1';
UPDATE users SET nickname = '小明同学' WHERE username = 'student1';

-- 添加更多测试用户（密码都是: admin123）
INSERT INTO users (username, email, password, role, nickname) VALUES
('student2', 'student2@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', '小红同学'),
('student3', 'student3@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', '小刚同学'),
('student4', 'student4@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', '小丽同学')
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);

-- 插入订单数据
-- type: 1-快递代取，2-外卖配送，3-代购服务，4-其他
-- status: pending-待接单, accepted-已接单, completed-已完成, cancelled-已取消

-- 待接单的订单
INSERT INTO orders (user_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, created_at) VALUES
(3, '帮忙取快递', '有个快递在菜鸟驿站，帮忙取一下送到宿舍楼下，谢谢！', 1, 5.00, '菜鸟驿站（东门）', '6号宿舍楼下', '13800138001', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(3, '代买奶茶', '想喝一杯奶茶，帮忙买一杯蜜雪冰城的珍珠奶茶，大杯，少冰少糖', 2, 8.00, '蜜雪冰城（校门口）', '图书馆门口', '13800138001', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(4, '取外卖', '点了外卖但是在上课，帮忙取一下放在宿舍门口，备注：208宿舍', 2, 3.00, '校门口外卖柜', '3号宿舍楼208', '13800138002', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(4, '代购文具', '需要买一些文具：笔记本2本、中性笔5支、便利贴1包', 3, 10.00, '校内超市', '教学楼A座101', '13800138002', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, '帮忙打印', '需要打印20页资料，黑白双面，帮忙去打印店打印一下', 4, 6.00, '图书馆打印店', '5号宿舍楼下', '13800138003', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(5, '取快递（大件）', '有个大件快递，一个人搬不动，需要两个人帮忙取一下', 1, 15.00, '快递站（西门）', '7号宿舍楼一楼', '13800138003', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 已接单的订单
INSERT INTO orders (user_id, acceptor_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, created_at, accepted_at) VALUES
(3, 5, '代买早餐', '帮忙买早餐：包子2个、豆浆1杯', 2, 5.00, '食堂二楼', '4号宿舍楼下', '13800138001', '[]', 'accepted', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 6, '取快递', '帮忙取个小件快递', 1, 4.00, '菜鸟驿站（南门）', '2号宿舍楼下', '13800138002', '[]', 'accepted', DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(5, 3, '代购零食', '帮忙买点零食：薯片、可乐、巧克力', 3, 12.00, '校外超市', '6号宿舍楼305', '13800138003', '[]', 'accepted', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR));

-- 已完成的订单
INSERT INTO orders (user_id, acceptor_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, created_at, accepted_at, completed_at) VALUES
(3, 4, '取快递', '帮忙取快递一个', 1, 5.00, '菜鸟驿站（东门）', '5号宿舍楼下', '13800138001', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 30 MINUTE),
(4, 3, '代买午餐', '帮忙买午餐：盖浇饭一份', 2, 8.00, '食堂一楼', '教学楼B座', '13800138002', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 5 MINUTE, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 25 MINUTE),
(5, 4, '打印资料', '帮忙打印10页资料', 4, 4.00, '图书馆打印店', '3号宿舍楼下', '13800138003', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 15 MINUTE, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 40 MINUTE),
(3, 5, '代购书籍', '帮忙去书店买本教材', 3, 20.00, '校外书店', '图书馆门口', '13800138001', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 20 MINUTE, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR);

-- 已取消的订单
INSERT INTO orders (user_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, cancel_reason, created_at, cancelled_at) VALUES
(4, '取快递', '取快递一个', 1, 5.00, '菜鸟驿站', '宿舍楼下', '13800138002', '[]', 'cancelled', '自己已经取了', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 1 HOUR),
(5, '代买晚餐', '帮忙买晚餐', 2, 10.00, '食堂', '宿舍', '13800138003', '[]', 'cancelled', '临时有事不需要了', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 30 MINUTE);

-- 查看插入的订单数据
SELECT 
  o.id,
  o.title,
  o.type,
  o.price,
  o.status,
  u.nickname as publisher_name,
  a.nickname as acceptor_name,
  o.created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN users a ON o.acceptor_id = a.id
ORDER BY o.created_at DESC;
