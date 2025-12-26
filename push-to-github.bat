@echo off
echo 正在推送到GitHub...
echo.

REM 设置Git配置
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
git config --global http.version HTTP/1.1

echo 当前提交状态:
git log --oneline -1
echo.

echo 尝试推送到GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 成功推送到GitHub!
    echo 项目地址: https://github.com/545426946/campus-errand
) else (
    echo.
    echo ❌ 推送失败，可能的原因:
    echo 1. 网络连接问题
    echo 2. 需要GitHub认证
    echo 3. 防火墙阻止连接
    echo.
    echo 建议解决方案:
    echo 1. 检查网络连接
    echo 2. 配置GitHub Personal Access Token
    echo 3. 使用VPN或代理
    echo 4. 手动上传项目文件到GitHub
)

echo.
pause