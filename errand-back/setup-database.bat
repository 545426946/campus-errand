@echo off
echo ====================================
echo 导入数据库结构
echo ====================================
echo.
echo 请输入MySQL root密码（如果没有密码直接按回车）:
mysql -u root -p < database\schema.sql
echo.
echo ====================================
echo 数据库结构导入完成！
echo ====================================
echo.
echo 是否导入测试数据？(Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo 导入测试数据...
    mysql -u root -p < database\seed.sql
    echo 测试数据导入完成！
)
echo.
echo 完成！按任意键退出...
pause > nul
