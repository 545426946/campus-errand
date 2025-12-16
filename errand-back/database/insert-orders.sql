USE errand_platform;

UPDATE users SET nickname = 'Admin User' WHERE username = 'admin';
UPDATE users SET nickname = 'Teacher Zhang' WHERE username = 'teacher1';
UPDATE users SET nickname = 'Student Ming' WHERE username = 'student1';

INSERT INTO users (username, email, password, role, nickname) VALUES
('student2', 'student2@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', 'Student Hong'),
('student3', 'student3@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', 'Student Gang'),
('student4', 'student4@example.com', '$2a$12$F60MTP9fmvdzacblsQHAmegEPLMq.TxvU3f53Mke8/cigvoQPXXmW', 'student', 'Student Li')
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);

INSERT INTO orders (user_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, created_at) VALUES
(3, 'Help pick up package', 'Please help me pick up a package from the station', 1, 5.00, 'Package Station (East Gate)', 'Dorm Building 6', '13800138001', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(3, 'Buy milk tea', 'Please buy me a milk tea, large size, less ice less sugar', 2, 8.00, 'Mixue Ice Cream (School Gate)', 'Library Entrance', '13800138001', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(4, 'Pick up takeout', 'Please pick up my takeout, Room 208', 2, 3.00, 'School Gate Takeout Cabinet', 'Dorm Building 3 Room 208', '13800138002', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(4, 'Buy stationery', 'Need to buy: 2 notebooks, 5 pens, 1 pack sticky notes', 3, 10.00, 'Campus Supermarket', 'Teaching Building A 101', '13800138002', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 'Help print documents', 'Need to print 20 pages, black and white, double-sided', 4, 6.00, 'Library Print Shop', 'Dorm Building 5', '13800138003', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(5, 'Pick up large package', 'Large package, need two people to help', 1, 15.00, 'Express Station (West Gate)', 'Dorm Building 7 First Floor', '13800138003', '[]', 'pending', DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO orders (user_id, acceptor_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, created_at, accepted_at) VALUES
(3, 5, 'Buy breakfast', 'Please buy breakfast: 2 buns, 1 soy milk', 2, 5.00, 'Cafeteria 2nd Floor', 'Dorm Building 4', '13800138001', '[]', 'accepted', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 6, 'Pick up package', 'Please pick up a small package', 1, 4.00, 'Package Station (South Gate)', 'Dorm Building 2', '13800138002', '[]', 'accepted', DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(5, 3, 'Buy snacks', 'Please buy snacks: chips, cola, chocolate', 3, 12.00, 'Off-campus Supermarket', 'Dorm Building 6 Room 305', '13800138003', '[]', 'accepted', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR));

INSERT INTO orders (user_id, acceptor_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, created_at, accepted_at, completed_at) VALUES
(3, 4, 'Pick up package', 'Please pick up one package', 1, 5.00, 'Package Station (East Gate)', 'Dorm Building 5', '13800138001', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 30 MINUTE),
(4, 3, 'Buy lunch', 'Please buy lunch: one rice bowl', 2, 8.00, 'Cafeteria 1st Floor', 'Teaching Building B', '13800138002', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 5 MINUTE, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 25 MINUTE),
(5, 4, 'Print documents', 'Please print 10 pages', 4, 4.00, 'Library Print Shop', 'Dorm Building 3', '13800138003', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 15 MINUTE, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 40 MINUTE),
(3, 5, 'Buy textbook', 'Please buy a textbook from bookstore', 3, 20.00, 'Off-campus Bookstore', 'Library Entrance', '13800138001', '[]', 'completed', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 20 MINUTE, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR);

INSERT INTO orders (user_id, title, description, type, price, pickup_location, delivery_location, contact_phone, images, status, cancel_reason, created_at, cancelled_at) VALUES
(4, 'Pick up package', 'Pick up one package', 1, 5.00, 'Package Station', 'Dorm Building', '13800138002', '[]', 'cancelled', 'Already picked up myself', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 1 HOUR),
(5, 'Buy dinner', 'Please buy dinner', 2, 10.00, 'Cafeteria', 'Dorm', '13800138003', '[]', 'cancelled', 'No longer needed', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 30 MINUTE);
