@echo off
chcp 65001 >nul
echo ====================================
echo Import Database Schema
echo ====================================
echo.
echo Enter MySQL root password (press Enter if no password):
mysql -u root -p < database\schema.sql
echo.
echo ====================================
echo Database schema imported successfully!
echo ====================================
echo.
echo Import test data? (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo Importing test data...
    mysql -u root -p < database\seed.sql
    echo Test data imported successfully!
)
echo.
echo Done! Press any key to exit...
pause > nul
