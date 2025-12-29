@echo off
chcp 65001 >nul
echo ========================================
echo 停止后端服务 (端口 3000)
echo ========================================
echo.

echo 正在查找 3000 端口的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    set PID=%%a
)

if defined PID (
    echo 找到进程 PID: %PID%
    echo 正在停止进程...
    taskkill /F /PID %PID%
    if %errorlevel% == 0 (
        echo.
        echo ✓ 后端服务已停止
    ) else (
        echo.
        echo ✗ 停止失败，可能需要管理员权限
    )
) else (
    echo.
    echo ℹ 3000 端口没有运行的进程
)

echo.
pause
