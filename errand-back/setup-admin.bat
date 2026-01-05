@echo off
echo ========================================
echo 校园跑腿管理员系统初始化
echo ========================================
echo.

echo [1/2] 创建管理员数据表...
node create-admin-table.js

if %errorlevel% neq 0 (
    echo.
    echo 错误：数据表创建失败！
    echo 请检查数据库连接配置。
    pause
    exit /b 1
)

echo.
echo [2/2] 初始化完成！
echo.
echo ========================================
echo 默认管理员账号信息：
echo 用户名: admin
echo 密码: admin123
echo ========================================
echo.
echo 请使用以下命令启动后端服务：
echo   npm start
echo.
echo 然后打开 errand-admin/index.html 访问管理后台
echo.
pause
