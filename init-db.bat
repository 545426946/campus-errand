@echo off
chcp 65001 >nul
echo ====================================
echo 数据库初始化脚本
echo ====================================
echo.

echo 1. 创建数据库和表结构...
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS errand_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p123456 errand_platform < database\migrations\schema.sql
echo ✅ 数据库结构创建完成
echo.

echo 2. 添加钱包交易表...
mysql -u root -p123456 errand_platform < database\migrations\add-wallet-transactions.sql
echo ✅ 钱包交易表添加完成
echo.

echo 3. 添加通知表...
mysql -u root -p123456 errand_platform < database\migrations\add-notifications-table.sql
echo ✅ 通知表添加完成
echo.

echo 4. 添加微信登录相关字段...
mysql -u root -p123456 errand_platform < database\migrations\add_wechat_fields.sql
echo ✅ 微信字段添加完成
echo.

echo 5. 更新用户表字段...
mysql -u root -p123456 errand_platform < database\migrations\update-user-fields.sql
echo ✅ 用户表更新完成
echo.

echo ====================================
echo 数据库初始化完成！
echo ====================================
echo.
pause
