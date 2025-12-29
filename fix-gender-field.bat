@echo off
echo 修复 gender 字段类型...
echo.

cd errand-back
mysql -u root -p < database/migrations/fix-gender-column.sql

echo.
echo 修复完成！
pause
