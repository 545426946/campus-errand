@echo off
chcp 65001 >nul
echo ========================================
echo 初始化钱包系统数据库表
echo ========================================
echo.

cd errand-back

echo [1/2] 创建钱包交易记录表...
node create-wallet-transactions-table.js
if errorlevel 1 (
    echo ❌ 创建钱包交易记录表失败
    pause
    exit /b 1
)
echo.

echo [2/2] 初始化钱包系统...
node init-wallet-system.js
if errorlevel 1 (
    echo ❌ 初始化钱包系统失败
    pause
    exit /b 1
)
echo.

cd ..

echo ========================================
echo ✅ 钱包系统初始化完成！
echo ========================================
echo.
echo 提示：
echo 1. wallet_transactions 表已创建
echo 2. withdraw_requests 表已创建
echo 3. 用户余额字段已添加
echo.
pause
