@echo off
chcp 65001 >nul
echo ========================================
echo 钱包系统初始化脚本
echo ========================================
echo.

cd errand-back

echo [1/2] 检查依赖...
if not exist node_modules (
    echo 正在安装依赖...
    call npm install
) else (
    echo ✓ 依赖已安装
)
echo.

echo [2/2] 初始化钱包数据库...
node init-wallet-system.js

echo.
echo ========================================
echo 初始化完成！
echo ========================================
echo.
echo 接下来可以：
echo 1. 运行 start-backend.bat 启动后端服务
echo 2. 在微信开发者工具中打开 errand-front 目录
echo 3. 测试钱包功能
echo.
pause
