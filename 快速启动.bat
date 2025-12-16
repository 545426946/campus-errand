@echo off
chcp 65001 >nul
echo ================================
echo   校园跑腿平台 - 快速启动
echo ================================
echo.

echo [1/3] 检查后端服务器...
cd errand-back

echo [2/3] 启动后端服务器...
echo 服务器将运行在 http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

node server.js

pause
