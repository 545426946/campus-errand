@echo off
chcp 65001 >nul
echo ========================================
echo   前后端数据交互配置脚本
echo ========================================
echo.

echo [1/5] 检查后端环境...
cd errand-back
if not exist node_modules (
    echo 正在安装后端依赖...
    call npm install
) else (
    echo 后端依赖已安装
)
echo.

echo [2/5] 检查环境配置...
if not exist .env (
    echo 创建 .env 文件...
    copy .env.example .env
    echo 请编辑 errand-back\.env 文件，配置数据库连接信息
    pause
) else (
    echo .env 文件已存在
)
echo.

echo [3/5] 初始化数据库...
echo 请确保MySQL服务已启动
echo.
set /p db_user="请输入MySQL用户名 (默认: root): "
if "%db_user%"=="" set db_user=root

set /p db_pass="请输入MySQL密码: "

echo.
echo 正在创建数据库和表结构...
mysql -u %db_user% -p%db_pass% < database\schema.sql
if errorlevel 1 (
    echo 数据库初始化失败，请检查MySQL连接
    pause
    exit /b 1
)

echo 正在插入测试数据...
mysql -u %db_user% -p%db_pass% < database\seed.sql
mysql -u %db_user% -p%db_pass% < database\insert-orders.sql

echo 数据库初始化完成！
echo.

echo [4/5] 检查前端配置...
cd ..\errand-front
echo 前端配置文件位置: errand-front\utils\config.js
echo 请确保 baseUrl 指向后端地址: http://localhost:3000/api
echo.

echo [5/5] 配置完成！
echo.
echo ========================================
echo   配置完成，可以开始测试了！
echo ========================================
echo.
echo 启动步骤：
echo 1. 启动后端服务：
echo    cd errand-back
echo    npm run dev
echo.
echo 2. 在微信开发者工具中打开 errand-front 目录
echo.
echo 3. 查看测试指南：前后端数据交互测试指南.md
echo.
pause
