@echo off
chcp 65001 >nul
echo ========================================
echo Starting Development Server
echo ========================================
echo.

echo Checking if port 3000 is available...
netstat -ano | findstr :3000 | findstr LISTENING >nul

if %errorlevel% equ 0 (
    echo.
    echo WARNING: Port 3000 is already in use!
    echo.
    echo Options:
    echo 1. Kill the process and start server
    echo 2. Cancel
    echo.
    set /p choice=Choose option (1 or 2): 
    
    if "!choice!"=="1" (
        echo.
        echo Killing process on port 3000...
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 /nobreak >nul
        echo Process killed. Starting server...
        echo.
    ) else (
        echo Cancelled.
        pause
        exit
    )
)

echo Starting server on port 3000...
echo Press Ctrl+C to stop
echo.
npm run dev
