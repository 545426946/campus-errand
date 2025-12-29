@echo off
chcp 65001 >nul
echo ========================================
echo 微信登录功能配置向导
echo ========================================
echo.

echo [步骤 1/3] 检查数据库连接...
cd errand-back
node -e "const db = require('./src/config/database'); db.execute('SELECT 1').then(() => { console.log('✓ 数据库连接成功'); process.exit(0); }).catch(err => { console.error('✗ 数据库连接失败:', err.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo 数据库连接失败，请检查配置后重试
    pause
    exit /b 1
)

echo.
echo [步骤 2/3] 执行数据库迁移...
mysql -u errand_user -p -D errand_platform < database/migrations/add_wechat_fields.sql

if errorlevel 1 (
    echo.
    echo 数据库迁移失败，请手动执行 SQL 脚本
    echo 脚本位置: errand-back/database/migrations/add_wechat_fields.sql
    pause
    exit /b 1
)

echo ✓ 数据库迁移完成

echo.
echo [步骤 3/3] 配置微信小程序信息
echo.
echo 请编辑 errand-back/.env 文件，添加以下配置：
echo.
echo WECHAT_APPID=your_wechat_appid
echo WECHAT_SECRET=your_wechat_secret
echo.
echo 获取方式：
echo 1. 登录微信公众平台 https://mp.weixin.qq.com/
echo 2. 进入"开发" - "开发管理" - "开发设置"
echo 3. 复制 AppID 和 AppSecret
echo.

echo ========================================
echo 配置完成！
echo ========================================
echo.
echo 后续步骤：
echo 1. 编辑 .env 文件添加微信配置
echo 2. 重启后端服务
echo 3. 在微信开发者工具中测试登录功能
echo.
echo 详细文档请查看: 微信登录功能实现文档.md
echo.

pause
