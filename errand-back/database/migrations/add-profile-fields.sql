-- Add user profile fields
ALTER TABLE users 
ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT 'other' COMMENT 'gender' AFTER phone,
ADD COLUMN school VARCHAR(100) COMMENT 'school' AFTER major,
ADD COLUMN bio TEXT COMMENT 'biography' AFTER school;