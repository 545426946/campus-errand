@echo off
chcp 65001 >nul
echo ========================================
echo 重启后端服务
echo ========================================
echo.

echo [1/2] 停止现有服务...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    set PID=%%a
)

if defined PID (
    echo 找到进程 PID: %PID%，正在停止...
    taskkill /F /PID %PID% >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo ✓ 已停止旧服务
) else (
    echo ℹ 没有运行的服务
)

echo.
echo [2/2] 启动后端服务...
cd errand-back
start "后端服务 - 端口 3000" cmd /k "npm start"

echo.
echo ✓ 后端服务已启动
echo.
echo 提示：
echo - 后端服务运行在 http://localhost:3000
echo - 新窗口会自动打开，请不要关闭
echo - 如需停止服务，运行 stop-backend.bat
echo.
pause
