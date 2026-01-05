@echo off
echo 正在启动后端服务器...
cd /d %~dp0\errand-back
echo 当前目录: %CD%
echo.
node server.js
pause
