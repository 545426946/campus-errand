@echo off
chcp 65001 >nul
echo ========================================
echo   更新通知功能
echo ========================================
echo.

echo [1/2] 更新数据库...
cd errand-back

set /p db_user="请输入MySQL用户名 (默认: root): "
if "%db_user%"=="" set db_user=root

set /p db_pass="请输入MySQL密码: "

echo.
echo 正在添加通知表...
mysql -u %db_user% -p%db_pass% < database\add-notifications-table.sql

if errorlevel 1 (
    echo 数据库更新失败
    pause
    exit /b 1
)

echo 数据库更新成功！
echo.

echo [2/2] 重启后端服务...
echo 请手动重启后端服务：
echo   cd errand-back
echo   npm run dev
echo.

echo ========================================
echo   更新完成！
echo ========================================
echo.
echo 新功能：
echo 1. 订单状态变更自动通知
echo 2. 通知列表页面
echo 3. 未读通知数量显示
echo 4. 点击通知跳转订单详情
echo.
echo 测试步骤：
echo 1. 重启后端服务
echo 2. 在小程序中接单或完成订单
echo 3. 查看"我的"页面的通知数量
echo 4. 点击进入通知页面查看
echo.
pause
