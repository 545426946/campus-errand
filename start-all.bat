@echo off
cd errand-back
echo 启动后端服务器...
start /MIN node server.js
echo 后端服务已启动
echo.
echo 请在另一个终端窗口中检查日志
pause
