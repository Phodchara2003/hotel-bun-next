@echo off
REM Start Development Script for Hotel Booking System
REM Script นี้จะจัดการ process ให้หยุดอัตโนมัติเมื่อกด Ctrl+C

echo ========================================
echo   Hotel Booking Development Server
echo ========================================
echo.

REM Kill existing processes on common ports
echo 🔄 Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM bun.exe 2>nul
echo.

REM Start backend server
echo 🚀 Starting Backend Server (Port 3003)...
start "Backend Server" /MIN powershell -Command "cd '%~dp0'; node backend\customer-server.js"
timeout /t 3 >nul

REM Start frontend server
echo 🚀 Starting Frontend Server (Port 3002)...
cd frontend
echo   Frontend will start at: http://localhost:3002
echo   Press Ctrl+C to stop all servers
echo.

REM This will handle Ctrl+C gracefully
bun run dev -- -p 3002

REM When user presses Ctrl+C, cleanup will happen
echo.
echo 🛑 Shutting down servers...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM bun.exe 2>nul
echo ✅ All servers stopped.
pause