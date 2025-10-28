@echo off
REM Production Start Script for Hotel Booking System
REM Frontend: Port 3680  
REM Backend: Port 5680

echo.
echo 🏨 Starting Hotel Booking System in Production Mode
echo Frontend Port: 3680
echo Backend Port: 5680
echo.

echo 🚀 Starting Backend Server...
start "Backend Server" cmd /k "cd /d c:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\backend && bun run server.js"

timeout /t 3 /nobreak >nul

echo 🌐 Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d c:\Users\mmoor\OneDrive\Desktop\hotel-bun-next\frontend && npm run start"

echo.
echo ✅ Production servers are starting...
echo Frontend: http://localhost:3680
echo Backend: http://localhost:5680
echo.
pause