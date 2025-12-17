@echo off
chcp 65001 >nul
echo ========================================
echo 校园跑腿小程序后端 - 更新并启动
echo ========================================
echo.

echo [1/3] 更新数据库字段...
mysql -u root -p123456 < database\update-user-fields.sql
if %errorlevel% neq 0 (
    echo ❌ 数据库更新失败！
    echo 请检查MySQL是否运行，用户名密码是否正确
    pause
    exit /b 1
)
echo ✅ 数据库更新完成
echo.

echo [2/3] 检查依赖...
if not exist node_modules (
    echo 正在安装依赖...
    call npm install
)
echo ✅ 依赖检查完成
echo.

echo [3/3] 启动服务器...
echo 服务器将在 http://localhost:3000 运行
echo 按 Ctrl+C 停止服务器
echo.
node server.js
