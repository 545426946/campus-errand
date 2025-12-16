@echo off
chcp 65001 >nul
:menu
cls
echo.
echo ========================================
echo   校园跑腿后端服务 - 快速启动
echo ========================================
echo.
echo 1. 添加订单表
echo 2. 检查数据库
echo 3. 启动开发服务器
echo 4. 测试API连接
echo 5. 关闭端口3000占用
echo 6. 退出
echo.
echo ========================================
set /p choice=请选择操作 (1-6): 

if "%choice%"=="1" (
    cls
    call add-orders-simple.bat
    goto menu
)
if "%choice%"=="2" (
    cls
    call check-database.bat
    goto menu
)
if "%choice%"=="3" (
    cls
    echo 启动开发服务器...
    echo 按 Ctrl+C 停止服务器
    echo.
    npm run dev
    pause
    goto menu
)
if "%choice%"=="4" (
    cls
    call test-api.bat
    goto menu
)
if "%choice%"=="5" (
    cls
    call kill-port-3000.bat
    goto menu
)
if "%choice%"=="6" (
    exit
)

echo 无效选择，请重试
pause
goto menu
